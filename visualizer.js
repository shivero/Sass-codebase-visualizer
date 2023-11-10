import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
class Visualizer {
    constructor() {
        this.nodes = [];
        this.links = [];
        if (process.argv[2]) {
            this.entryPoint = process.argv[2];
        }
    }
    processNested(ImportLineFound, filePath) {
        ImportLineFound.forEach((linePath) => {
            console.log(`${this.pad(2)}Processing ${linePath} from ${filePath}`);
            let submoduleName = linePath.replace(/@import\s+['"](.*)['"]/g, '$1');
            let subfilePath = dirname(filePath) + '/' + submoduleName + '.scss';
            let fileExists = existsSync(subfilePath);
            ({ fileExists, subfilePath } = this.tryResolveWithUnderscore(fileExists, subfilePath));
            const link = {
                source: filePath,
                target: subfilePath,
                value: fileExists ? 1 : 0
            };
            this.links.push(link);
            let filesFromImports = this.scanFilesForImports(subfilePath);
            if (filesFromImports) {
                this.processNested(filesFromImports, subfilePath);
            }
        });
    }
    tryResolveWithUnderscore(fileExists, subfilePath) {
        if (!fileExists) {
            var subfilePathWithUnderscore = subfilePath.replace(/\/([^\/]*)$/, '/_$1');
            this.logMessage('info', `${this.pad(4)}File not found - resolving with underscore: ${subfilePathWithUnderscore}`);
            try {
                fileExists = existsSync(subfilePathWithUnderscore);
                if (fileExists) {
                    subfilePath = subfilePathWithUnderscore;
                }
            }
            catch (error) {
                console.log(`${this.pad(4)}File not found:`, subfilePathWithUnderscore);
            }
        }
        return { fileExists, subfilePath };
    }
    scanFilesForImports(filePath) {
        let contents = '';
        const fileExists = existsSync(filePath);
        const isMain = filePath === this.entryPoint;
        try {
            contents = readFileSync(filePath, 'utf8');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logMessage('error', `${this.pad(4)} File not found: ${filePath}`);
            }
            else {
                this.logMessage('error', `Error reading file ${error.code} in ${filePath}`);
            }
        }
        var fileName = filePath.replace(/^.*[\\\/]/, '');
        const node = {
            id: filePath,
            label: fileName,
            group: isMain ? 1 : fileExists ? 2 : 3
        };
        this.nodes.push(node);
        const ImportLineFound = this.parseImports(contents);
        return ImportLineFound;
    }
    parseImports(contents) {
        return contents.match(/@import\s+['"](.*)['"]/g);
    }
    pad(n) {
        return Array(n).join(' ');
    }
    logMessage(type, message) {
        const colorCodes = {
            'info': '\x1b[34m%s\x1b[0m',
            'success': '\x1b[32m%s\x1b[0m',
            'warning': '\x1b[33m%s\x1b[0m',
            'error': '\x1b[31m%s\x1b[0m' // Red
        };
        console.log(colorCodes[type], message);
    }
    main() {
        if (!this.entryPoint) {
            this.logMessage('error', 'Please provide entry point as a parameter');
            return;
        }
        this.logMessage('success', `Visualizer starts in: ${this.entryPoint}`);
        try {
            let importLines = this.scanFilesForImports(this.entryPoint);
            if (importLines) {
                this.processNested(importLines, this.entryPoint);
            }
            const tree = {
                nodes: this.nodes,
                links: this.links
            };
            try {
                writeFileSync('tree.json', JSON.stringify(tree));
                this.logMessage('success', 'Visualizer finished');
            }
            catch (error) {
                this.logMessage('error', 'Error writing to file');
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
export { Visualizer };
let visualizer = new Visualizer();
visualizer.main();
