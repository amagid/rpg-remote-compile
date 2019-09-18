# RPG Remote Compilation

This is a simple project which can be used as a template for working in RPG remotely. When working on an IBM i, RPG programmers typically have to work directly on the main IBM i using a supported editor because their laptop or workstation is incapable of compiling the RPG code.

This quick project exposes a simple command line tool which can be configured to connect to an IBM i so that you can edit your RPG code locally in your favorite editor (I use VSCode), and push your changes to the IBM i for compilation. You can then check the full compiler output to ensure everything went well. This way, you can work however you like, wherever you like, and not have to worry that your RPG code won't compile after you've made your changes.

### Usage
The command line tool is in node (I know, nonstandard, but also the language I work fastest in). Try out `node icompile.js -h` for help.

### Notes
- I'm aware that using SCP to move the RPG code around is hilariously inefficient and that I should be tracking deltas and only moving those. Counterpoint: I wrote this tool in 3 hours to solve an immediate need. If such a time comes that it needs to be made into a production-ready product, you can bet I'll be rearchitecting the whole thing.