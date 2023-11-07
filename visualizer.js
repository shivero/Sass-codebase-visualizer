import { existsSync, readFileSync, writeFileSync } from 'fs';
import { readFile } from 'node:fs/promises';
import { dirname } from 'path';


let nodes = [];
let links = [];



async function main() {
    let entryPoint = 'tester.scss';
    try {
        let contents = await readFile(entryPoint, { encoding: 'utf8' });
        console.log(contents);
        let importLines = ScanFilesForImports(entryPoint);
        if (importLines) {
            ProcessNested(importLines, entryPoint);
        }
        const miserables = {
            nodes: nodes,
            links: links
        }
        writeFileSync('tree.json', JSON.stringify(miserables));
    } catch (error) {
        console.log(error);
    }

}


main();


function ProcessNested(ImportLineFound, filePath) {


    ImportLineFound.forEach(linePath => {

        let submoduleName = linePath.replace(/@import\s+['"](.*)['"]/g, '$1');
        const subfilePath = dirname(filePath) + '/' + submoduleName + '.scss';

        const fileExists = existsSync(subfilePath);

        const link = {
            source: filePath,
            target: subfilePath,
            value: fileExists ? 5 : 2
        }
        links.push(link);

        let filesFromImports = ScanFilesForImports(subfilePath, true);
        if (filesFromImports) {
            ProcessNested(filesFromImports, subfilePath);
        }
    });




}

function ScanFilesForImports(filePath) {
    var isMain = filePath === 'tester.scss';
    const fileExists = existsSync(filePath);
    const fileEntryPoint = {
        id: filePath,
        label: filePath + ' (entry point)',
        group: isMain ? 4 : fileExists ? 3 : 2
    };
    nodes.push(fileEntryPoint);
    let contents = ''
    try {
        contents = readFileSync(filePath, 'utf8');

    } catch (error) {
        if (error.code === 'ENOENT') {

            return null;
        }

        return null;
    }
    const ImportLineFound = ParseImports(contents);
    return ImportLineFound;
}

function ParseImports(contents) {
    return contents.match(/@import\s+['"](.*)['"]/g);
}
