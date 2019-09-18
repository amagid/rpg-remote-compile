#!/usr/bin/env node

const fs = require('fs');
const { exec, execSync } = require('child_process');

async function run() {
    const args = getArgs();

    if (args.h || args.help) {
        return help();
    }

    if (args.c || args.clean) {
        return clearStoredReports();
    }

    try {
        const output = await compile(args.host, args.lib);
        const compilerOutput = output[2].stdout;
        const reportFileName = storeCompilationReport(compilerOutput);
        if (args.v) { console.log(compilerOutput) }
        displaySummaryMessage(compilerOutput, reportFileName);
    } catch (e) {
        console.error('\n\n== Compilation Failed ==\n');
        console.error(e.message);
    }
}
run();


function help() {
    console.log('\nRemotely compiles your project on an IBM i and returns the result:\n\n' +
        '-c        Clear (delete) old compilation reports before running\n' +
        '-e        Use environment variables for HOST and LIB arguments\n' +
        '-h        Display help\n' +
        '-v        Print full compiler output to console\n' +
        '--host    Set the remote host to compile on. Compatible with openssh configured hosts\n' +
        '--lib     The Library on the IBM i where your objects will be created\n\n' +
        'Usage Example:\n' +
        'node icompile.js --host=iseries-stg-root --lib=TUTORIAL1\n\n' +
        'Usage Example 2:\n' +
        'export ICOMPILE_HOST=iseries-stg-root\n' +
        'export ICOMPILE_LIB=TUTORIAL1\n' +
        'node icompile.js -e');
}

async function compile(host, lib) {
    if (!host) {
        throw new Error("Host parameter is required. Use 'node icompile.js -h' for more information.");
    } else if (!lib) {
        throw new Error("Library parameter is required. Use 'node icompile.js -h' for more information.");
    }

    console.log(`Compiling remotely to library ${lib} on host ${host}`);

    fs.writeFileSync('./.remote-build.sh', `#!/bin/bash\nexport LIB=${lib}\ncd make/${lib}\n/QOpenSys/pkgs/bin/gmake init\n/QOpenSys/pkgs/bin/gmake clean\n/QOpenSys/pkgs/bin/gmake`);

    const output = [];
    output.push(await new Promise(r => exec(`ssh ${host} 'mkdir -p make/${lib}'`, { stdio: 'pipe' }, (err, stdout, stderr) => r({err, stdout, stderr}))));
    output.push(await new Promise(r => exec(`scp Makefile .remote-build.sh *.rpgle ${host}:make/${lib}`, { stdio: 'pipe' }, (err, stdout, stderr) => r({err, stdout, stderr}))));
    output.push(await new Promise(r => exec(`ssh ${host} 'cd make/${lib}; .remote-build.sh'`, {stdio: 'pipe'}, (err, stdout, stderr) => r({err, stdout, stderr}))));

    return output;
}

function getArgs() {
    const args = {};

    let argName;
    for (let i = 2; i < process.argv.length; i++) {
        argName = process.argv[i].split('=')[0].split('-').pop();
        args[argName] = process.argv[i].split('=')[1] || true;
    }

    if (process.argv.length === 2) {
        args.h = true;
    }

    if (args.e) {
        args.host = args.host || process.env.ICOMPILE_HOST;
        args.lib = args.lib || process.env.ICOMPILE_LIB;
    }

    return args;
}

function storeCompilationReport(output) {
    try {
        execSync('mkdir icompile-reports', { stdio: 'pipe' });
    } catch (e) {}
    const filename = `icompile-reports/${(new Date).toISOString().replace(/:/g, '-').split('.')[0]}.log`;
    fs.writeFile(filename, output, (err) => {
        if (err) {
            console.error('Failed to write compilation report file:', err);
        }
    });
    return filename;
}

function displaySummaryMessage(output, reportFileName) {
    const maxError = getMaxErrorSeverity(output);
    let summaryMessage = '\n\n';
    if (isNaN(maxError)) {
        summaryMessage += '== An Unknown Error has Occurred ==';
    } else if (maxError < 10) {
        summaryMessage += '== Compilation Succeeded! ==';
    } else if (maxError < 20) {
        summaryMessage += '== Compilation Succeeded with Warnings ==';
    } else if (maxError < 30) {
        summaryMessage += '== Compilation Encountered Errors ==';
    } else {
        summaryMessage += '== Compilation Failed with Severe Errors ==';
    }

    summaryMessage += `\n\n${maxError.toString().padStart(2, '0')} Highest Severity`;
    summaryMessage += `\nFull Compilation Report Available at: ${reportFileName}`;

    console.log(summaryMessage);
}

function getMaxErrorSeverity(compilerOutput) {
    return parseInt((compilerOutput.toString().match(/ (\d{2}) /g) || []).pop());
}

function clearStoredReports() {
    return execSync('rm icompile-reports/*');
}