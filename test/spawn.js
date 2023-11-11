const { spawn } = require('child_process');
const path = '../server_nodejs';
const cmd = 's';
const exe = `cd ${path} && yarn ${cmd}`;

function spawnInit() {
  const child = spawn(exe, { shell: true });

  if (child?.pid !== null && child?.pid !== undefined) console.log("Server is ready");

  if (child?.stderr) {
    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
  }

  if (child?.stdout) {
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  }

  if (child) {
    child.on("error", (error) => {
      console.error("Child process error:", error);
    });
    child.on("exit", (e) => {
      console.log("exit", e);
    });
    child.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
  }
}

spawnInit()