import { readdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { readFile } from 'node:fs/promises';
import { dirname } from 'path';


let nodes = [];
let links = [];



async function main() {
    let entryPoint = 'tester.scss';
    try {
        let contents = await readFile(entryPoint, { encoding: 'utf8' });
        console.log(contents);
        let v1 = ScanFilesForImports(entryPoint);
        if (v1) {
            ProcessNested(v1, entryPoint);
        }
    } catch (error) {
        console.log(error);
    }

}


main();


function ProcessNested(ImportLineFound, filePath) {
    var isMain = filePath === 'tester.scss';
    const fileEntryPoint = {
        id: filePath,
        label: filePath + ' (entry point)',
        group: isMain ? 4 : 3
    };
    nodes.push(fileEntryPoint);
    ImportLineFound.forEach(linePath => {

        let submoduleName = linePath.replace(/@import\s+['"](.*)['"]/g, '$1');
        const subfilePath = dirname(filePath) + '/' + submoduleName + '.scss';
        const fileExists = existsSync(subfilePath);


        const subNode = {
            id: subfilePath,
            label: subfilePath + '_partial',
            group: fileExists ? 2 : 1
        };
        nodes.push(subNode);

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



    const miserables = {
        nodes: nodes,
        links: links
    }
    writeFileSync('tree.json', JSON.stringify(miserables));
}

function ScanFilesForImports(filePath, isSubdir = false) {
    let pad = isSubdir ? '  ' : '';

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
