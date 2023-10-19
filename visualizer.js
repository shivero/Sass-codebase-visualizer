const fs = require('fs');
const path = require('path');

let nodes = [];
let links = [];


function scanSCSSFiles(directory) {
    const files = fs.readdirSync(directory);

    files.forEach(file => {

        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {

        } else if (path.extname(file) === '.scss') {
            console.log('Processing file: ' + filePath);
            const ImportLineFound = ScanFilesForImports(path.dirname(filePath) + '/' + filePath);

            if (ImportLineFound) {
                ProcessNested(ImportLineFound, filePath);
            }
        }
    });

}

console.log(scanSCSSFiles('./'));



function ProcessNested(ImportLineFound, filePath) {
    const currentNode = {
        id: filePath,
        label: filePath,
        group: 2
    };
    nodes.push(currentNode);

    ImportLineFound.forEach(linePath => {
        console.log('  >> processing line: ' + linePath);
        let submoduleName = linePath.replace(/@import\s+['"](.*)['"]/g, '$1');
        const subfilePath = path.dirname(filePath) + '/' + submoduleName + '.scss';


        const subNode = {
            id: subfilePath,
            label: subfilePath,
            group: 1
        };
        nodes.push(subNode);

        const link = {
            source: filePath,
            target: subfilePath,
            value: 2
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
    fs.writeFileSync('tree.json', JSON.stringify(miserables));
}

function ScanFilesForImports(filePath, isSubdir = false) {
    let pad = isSubdir ? '  ' : '';
    console.log(pad + 'Scanning file: ' + filePath);
    let contents = ''
    try {
        contents = fs.readFileSync(filePath, 'utf8');
        console.log('\n' + pad + contents + '\n')
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(pad + `  File not found: ${filePath}`);
            return null;
        }
        console.error(pad + `Error reading file: ${filePath} - ${error}`);
        return null;
    }
    const ImportLineFound = ParseImports(contents);
    return ImportLineFound;
}

function ParseImports(contents) {
    return contents.match(/@import\s+['"](.*)['"]/g);
}

