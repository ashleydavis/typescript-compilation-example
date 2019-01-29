import * as ts from "typescript";

//
// A snippet of TypeScript code that has a semantic/type error in it.
//
const code 
    = "function foo(input: number) {\n" 
    + "    console.log('Hello!');\n"
    + "};\n" 
    + "foo('x');"
    ;

//
// Analyze in-memory TypeScript code for errors.
//
function diagnoseCode(code: string, libs: string[]): ReadonlyArray<ts.Diagnostic> {
    const options = ts.getDefaultCompilerOptions();
    const realHost = ts.createCompilerHost(options, true);
    
    const dummyFilePath = "/in-memory-file.ts";
    const dummySourceFile = ts.createSourceFile(dummyFilePath, code, ts.ScriptTarget.Latest);
    
    const host: ts.CompilerHost = {
        fileExists: filePath => filePath === dummyFilePath || realHost.fileExists(filePath),
        directoryExists: realHost.directoryExists && realHost.directoryExists.bind(realHost),
        getCurrentDirectory: realHost.getCurrentDirectory.bind(realHost),
        getDirectories: realHost.getDirectories.bind(realHost),
        getCanonicalFileName: fileName => realHost.getCanonicalFileName(fileName),
        getNewLine: realHost.getNewLine.bind(realHost),
        getDefaultLibFileName: realHost.getDefaultLibFileName.bind(realHost),
        getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => fileName === dummyFilePath 
            ? dummySourceFile 
            : realHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile),
        readFile: filePath => filePath === dummyFilePath 
            ? code 
            : realHost.readFile(filePath),
        useCaseSensitiveFileNames: () => realHost.useCaseSensitiveFileNames(),
        writeFile: realHost.writeFile.bind(realHost),
    };
    
    const rootNames = libs.map(lib => require.resolve(`typescript/lib/lib.${lib}.d.ts`));
    const program = ts.createProgram(rootNames.concat([dummyFilePath]), options, host);
    return ts.getPreEmitDiagnostics(program);
}

console.log("==== Evaluating code ====");
console.log(code);
console.log("=========================");

const libs = [ 'es2015' ];
const diagnostics = diagnoseCode(code, libs);
console.log("Diagnosics:");
for (const diagnostic of diagnostics) {
    console.log(diagnostic.messageText);
}