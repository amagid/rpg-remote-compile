const fs = require('fs');
const {
    execSync
} = require('child_process');

function run() {
    const args = getArgs();

    if (args.h || args.help) {
        return help();
    }

    try {
        const output = compile(args.host, args.lib);
        console.log(output[2].toString());
    } catch (e) {
        console.error(e.message);
    }
}
run();


function help() {
    console.log('\nRemotely compiles your project on an IBM i and returns the result:\n\n' +
        '-h        Display help\n' +
        '-e        Use environment variables for HOST and LIB arguments\n' +
        '--host    Set the remote host to compile on. Compatible with openssh configured hosts\n' +
        '--lib     The Library on the IBM i where your objects will be created\n\n' +
        'Usage Example:\n' +
        'node icompile.js --host=iseries-stg-root --lib=TUTORIAL1\n\n' +
        'Usage Example 2:\n' +
        'export ICOMPILE_HOST=iseries-stg-root\n' +
        'export ICOMPILE_LIB=TUTORIAL1\n' +
        'node icompile.js -e');
}

function compile(host, lib) {
    if (!host) {
        throw new Error("Host parameter is required. Use 'icompile -h' for more information.");
    } else if (!lib) {
        throw new Error("Library parameter is required. Use 'icompile -h' for more information.");
    }

    console.log(`Compiling remotely to library ${lib} on host ${host}`);

    fs.writeFileSync('./.remote-build.sh', `#!/bin/bash\nexport LIB=${lib}\ncd make/${lib}\n/QOpenSys/pkgs/bin/gmake init\n/QOpenSys/pkgs/bin/gmake clean\n/QOpenSys/pkgs/bin/gmake`);

    const output = [];
    output.push(execSync(`ssh ${host} 'mkdir -p make/${lib}'`));
    output.push(execSync(`scp Makefile .remote-build.sh *.rpgle ${host}:make/${lib}`));
    output.push(execSync(`ssh ${host} 'cd make/${lib}; .remote-build.sh'`));

    return output;
}

function getArgs() {
    const args = {};
    let argName;
    for (let i = 2; i < process.argv.length; i++) {
        argName = process.argv[i].split('=')[0].split('-').pop();
        args[argName] = process.argv[i].split('=')[1] || true;
    }

    if (args.e) {
        args.host = args.host || process.env.ICOMPILE_HOST;
        args.lib = args.lib || process.env.ICOMPILE_LIB;
    }

    return args;
}