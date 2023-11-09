import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';
class Visualizer {
    constructor(enryPoint) {
        this.nodes = [];
        this.links = [];
        console.log('Visualizer created', enryPoint);
        this.entryPoint = enryPoint;
    }
    processNested(ImportLineFound, filePath) {
        ImportLineFound.forEach((linePath) => {
            let submoduleName = linePath.replace(/@import\s+['"](.*)['"]/g, '$1');
            const subfilePath = dirname(filePath) + '/' + submoduleName + '.scss';
            const fileExists = existsSync(subfilePath);
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
    scanFilesForImports(filePath) {
        const fileExists = existsSync(filePath);
        const isMain = filePath === this.entryPoint;
        const fileEntryPoint = {
            id: filePath,
            label: filePath,
            group: isMain ? 1 : fileExists ? 2 : 3
        };
        this.nodes.push(fileEntryPoint);
        let contents = '';
        try {
            contents = readFileSync(filePath, 'utf8');
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                console.log('File not found:', filePath);
            }
            else {
                console.log('Error reading file', error.code, filePath);
            }
        }
        const ImportLineFound = this.parseImports(contents);
        return ImportLineFound;
    }
    parseImports(contents) {
        return contents.match(/@import\s+['"](.*)['"]/g);
    }
    main() {
        try {
            let importLines = this.scanFilesForImports(this.entryPoint);
            if (importLines) {
                this.processNested(importLines, this.entryPoint);
            }
            const miserables = {
                nodes: this.nodes,
                links: this.links
            };
            writeFileSync('tree.json', JSON.stringify(miserables));
        }
        catch (error) {
            console.log(error);
        }
    }
}
export { Visualizer };
let visualizer = new Visualizer('tester.scss');
visualizer.main();
