import {ComponentOptions} from "pango-components";

export interface GccComponentOptions extends ComponentOptions {
    linker?: string;
    compilers?: { [extName: string]: string };
    allObjectFiles?: string[];
    outputFile?: string;
    allIncludeDirs?: string[];
    compilerOptions: string[];
}
