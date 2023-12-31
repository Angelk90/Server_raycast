import { useEffect, useState } from "react";
import { Icon, MenuBarExtra, getPreferenceValues, showToast, ActionPanel, Form, Action, Detail, List } from "@raycast/api";
import { useCachedPromise, showFailureToast } from "@raycast/utils";
import { exec as execCb, ChildProcess, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import { shellEnv } from "shell-env";
const exec = promisify(execCb);

interface Preferences {
    path: string;
}

interface Command {
    name: string;
    value: string;
}

interface Pid {
    pid: number | undefined;
    cmd: string;
    output: string[];
    error: string[];
}

interface PortInfo {
    host: string;
    port: number;
}

interface ProcessInfo {
    pid: number;
    path?: string;
    name?: string;
    parentPid?: number;
    parentPath?: string;
    user?: string;
    uid?: number;
    protocol?: string;
    portInfo?: PortInfo[];
    internetProtocol?: string;
}

enum LsofPrefix {
    PROCESS_NAME = "c",
    PROCESS_ID = "p",
    PARENT_PROCESS_ID = "R",
    USER_ID = "u",
    USER_NAME = "L",
    PROTOCOL = "P",
    PORTS = "n",
    INTERNET_PROTOCOLL = "t",
}

interface EnvType {
    env: Record<string, string>;
    cwd: string;
    shell: string;
}

let cachedEnv: EnvType | null = null;
const getCachedEnv = async (): Promise<EnvType | null> => {
    if (cachedEnv) return cachedEnv;
    try {
        const env = await shellEnv();
        cachedEnv = {
            env,
            cwd: env.HOME || `/Users/${process.env.USER}`,
            shell: env.SHELL,
        };
        return cachedEnv;
    } catch (error) {
        showFailureToast(error);
        throw error;
    }
};

function convertCommands(commands: { [key: string]: string }): Command[] {
    return Object.entries(commands).map(([name, value]) => ({ name, value }));
}

function isNumeric(character: string): boolean {
    return !Number.isNaN(Number(character));
}

const Command = ({ path }: { path: string }): { isLoading: boolean; data: Command[] | null; error: Error | undefined } => {
    const { isLoading, data, error } = useCachedPromise<Command[]>(async () => {
        const { stdout, stderr } = await exec(`find ${path}/package.json -exec echo -n "{}: " \\;`);

        if (stderr) {
            showFailureToast(stderr);
            throw new Error(stderr);
        }

        const files = stdout.split(": ").filter((file) => file.trim() !== "");
        let result = await Promise.all(
            files.map(async (file) => {
                const content = await fs.readFile(file, "utf-8");
                const json = JSON.parse(content);
                return json.scripts;
            })
        );

        return convertCommands(result[0]);
    });

    return { isLoading, data, error };
};

const App = (): JSX.Element => {
    const { path } = getPreferenceValues<Preferences>();
    const [cmd, setCmd] = useState("");
    const [output, setOutput] = useState<string>("");
    const [finished, setFinished] = useState<boolean>(false);
    const [execEnv, setExecEnv] = useState<any>(undefined);
    const [pids, setPids] = useState<Pid[]>([]);
    const [pidsList, setPidsList] = useState<ProcessInfo[]>([]);
    const { isLoading, data, error } = Command({ path });

    if (error) showFailureToast(error);

    useEffect(() => {
        const run = async () => setExecEnv(await getCachedEnv());
        run();
    }, []);

    useEffect(() => {
        //console.log(execEnv !== undefined);
    }, [execEnv]);

    useEffect(() => {
        //console.log(pidsList, pids);
    }, [pids, pidsList]);

    useEffect(() => {
        let killed = false;
        let child: ChildProcess | null = null;

        const runCommand = async () => {
            if (cmd === "" || execEnv === undefined) return;
            const exe = `cd ${path} && yarn ${cmd}`;
            child = spawn(exe, { shell: true, env: execEnv.env });

            if (child?.pid !== null && child?.pid !== undefined) {
                setPids((prevState: Pid[]) => [
                    ...prevState,
                    { pid: child?.pid, cmd, output: [], error: [] },
                ]);
                await showToast({ title: "Server is ready", message: "Server is ready" });
            }


            //console.log(child)

            if (child?.stderr) {
                child.stderr.on("data", (data: string) => {
                    console.log("stderr:", data.toString());
                    if (killed) return;
                    setPids((prevPids) =>
                        prevPids.map((pid) => {
                            if (pid.pid === child?.pid) {
                                return {
                                    ...pid,
                                    error: [...pid.error, data.toString()],
                                };
                            }
                            return pid;
                        })
                    );
                });
            }

            if (child?.stdout) {
                child.stdout.on("data", (data: string) => {
                    console.log("stdout:", data.toString(), child?.pid);
                    if (killed) return;
                    setPids((prevPids) =>
                        prevPids.map((pid) => {
                            if (pid.pid === child?.pid) {
                                return {
                                    ...pid,
                                    output: [...pid.output, data.toString()],
                                };
                            }
                            return pid;
                        })
                    );
                });
            }

            if (child) {
                child.on("error", (error) => {
                    console.error("Child process error:", error);
                });

                child.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`ps process exited with code ${code}`);
                    }
                });

                child.on("exit", () => {
                    console.log("exit");
                    if (killed) {
                        console.log("exit", 1);
                        return;
                    }
                    console.log("exit", 2);
                    setFinished(true);
                });
            }

        };

        const cleanup = () => {
            killed = true;
            console.log("cleanup", child);
            if (child !== null) {
                console.log("cleanup", 1);
                child.kill("SIGTERM");
            }
        };

        runCommand();
        return cleanup;
    }, [cmd]);

    const checkPid = async (): Promise<ProcessInfo[]> => {
        const cmd = `/usr/sbin/lsof +c0 -iTCP -w -sTCP:LISTEN -P -FpcRuLPn`;
        try {
            const { stdout, stderr } = await exec(cmd);
            if (stderr) {
                showFailureToast(stderr);
                throw new Error(stderr);
            }
            const processes = stdout.split("\np");
            const instances: ProcessInfo[] = [];
            for (const process of processes) {
                if (process.length === 0) continue;
                const lines = process.split("\n");
                const values: ProcessInfo = { pid: 0 };
                for (const line of lines) {
                    if (line.length === 0) continue;
                    const prefix = line[0];
                    const value = line.slice(1);
                    if (value.length === 0) continue;
                    switch (prefix) {
                        case LsofPrefix.PROCESS_ID:
                            values.pid = Number(value);
                            break;
                        case LsofPrefix.PROCESS_NAME:
                            values.name = value;
                            break;
                        case LsofPrefix.PARENT_PROCESS_ID:
                            values.parentPid = Number(value);
                            break;
                        case LsofPrefix.USER_NAME:
                            values.user = value;
                            break;
                        case LsofPrefix.USER_ID:
                            values.uid = Number(value);
                            break;
                        case LsofPrefix.PROTOCOL:
                            values.protocol = value;
                            break;
                        case LsofPrefix.PORTS:
                            values.portInfo
                                ? values.portInfo.push({
                                    host: value.split(":")[0],
                                    port: Number(value.split(":")[1]),
                                })
                                : (values.portInfo = [
                                    {
                                        host: value.split(":")[0],
                                        port: Number(value.split(":")[1]),
                                    },
                                ]);
                            break;
                        case LsofPrefix.INTERNET_PROTOCOLL:
                            values.internetProtocol = value;
                            break;
                        default:
                            if (isNumeric(prefix)) values.pid = Number(`${prefix}${value}`);
                            break;
                    }
                }
                instances.push(values);
            }
            setPidsList(instances);
            return instances;
        } catch (error) {
            showFailureToast(error);
            throw error;
        }
    };

    return (
        <List
            navigationTitle="Shell"
            searchBarPlaceholder="Search"
            searchBarAccessory={
                <List.Dropdown tooltip="Select" onChange={setCmd}>
                    <List.Dropdown.Item value="" title="Select" />
                    {data && data.length > 0 ? (
                        <List.Dropdown.Section>
                            {data.map((repository) => {
                                return (
                                    <List.Dropdown.Item
                                        key={repository.name}
                                        title={repository.name}
                                        value={repository.value}
                                    />
                                );
                            })}
                        </List.Dropdown.Section>
                    ) : null}
                </List.Dropdown>
            }
        >
            {pids[0]?.output?.map((item) => (
                <List.Item
                    key={item}
                    title={item}
                />
            ))}
        </List>
    );

};

export default App;

/*

<Form
            actions={
                <ActionPanel>
                    <Action.SubmitForm title="Submit" onSubmit={(values) => setCmd(values.name)} />
                </ActionPanel>
            }
        >
            <Form.Dropdown id="name" title="Favorite" defaultValue="s">
                {data?.map((el: Command) => (
                    <Form.Dropdown.Item key={el.value} value={el.name} title={el.name} />
                ))}
            </Form.Dropdown>
        </Form>
*/