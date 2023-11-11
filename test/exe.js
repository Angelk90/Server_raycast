const { exec } = require('child_process');
const path = '../server_nodejs';
const cmd = 's';
const exe = `cd ${path} && yarn ${cmd}`;

function exeInit() {
  exec(exe, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return;
    }
    if (stderr) {
      console.error(`Error executing command: ${error}`);
      return;
    }

    console.log(`Command executed successfully:\n${stdout}`);
  });
}

exeInit();