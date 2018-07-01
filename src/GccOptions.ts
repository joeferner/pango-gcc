import {ProjectOptions} from "pango";

export interface GccOptions {
    defaultCompiler?: string;
    defaultLinker?: string;
    compilers: { [extName: string]: string };
    linker: string;
    allObjectFiles: string[];
    compilerOptions?: string[];
    linkerOptions?: string[];
    includeDirs?: string[];
    outputFileName?: string;
    outputFile?: string;
}

export function getGccOptions(projectOptions: ProjectOptions): GccOptions {
    const existingOptions: GccOptions = projectOptions.gcc;
    const defaultCompiler = (existingOptions ? existingOptions.defaultCompiler : 'gcc') || 'gcc';
    const defaultLinker = (existingOptions ? existingOptions.defaultLinker : 'gcc') || 'gcc';
    return projectOptions.gcc = {
        compilers: {
            '.c': defaultCompiler,
            '.cpp': defaultCompiler,
            '.s': defaultCompiler
        },
        linker: defaultLinker,
        allObjectFiles: [],
        outputFileName: 'a.out',
        ...(projectOptions.gcc),
    };
}