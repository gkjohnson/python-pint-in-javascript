const pypy = 
    new pypyjs({
        stdin: pypyjs._defaultStdin,
        stdout: pypyjs._defaultStdout,
        stderr: pypyjs._defaultStderr
    });

window.pypy = pypy;

function writeFile(name, dir, content) {
        
    const script = 
`
import os
LIB_PATH = "${ dir }"

script = """${ content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') }"""
dir = os.path.join(LIB_PATH, "${ name }")

with open(dir, "w") as f:
    f.write(script)

`;
        
    return pypy.exec(script);
                
}

function defineModule(name, content) {
    
    return writeFile(name, '/lib/pypyjs/lib_pypy/', content);
    
}

(async () => {

    await pypy.ready();

    pypy.exec(
`
import os
os.makedirs("/lib/pypyjs/lib_pypy/pint")
os.makedirs("/lib/pypyjs/lib_pypy/pint/compat")
`);

    const modules = await fetch('./modules.json').then(res => res.json());
    const promises = [];
    Object
        .keys(modules)
        .forEach(name => {
            promises.push(
                fetch(modules[name])
                    .then(res => res.text())
                    .then(res => defineModule(name, res))
            );
        });

    const files = await fetch('./files.json').then(res => res.json());
    Object
        .keys(files)
        .forEach(name => {
            promises.push(
                fetch(files[name])
                    .then(res => res.text())
                    .then(res => writeFile(name, '/', res))
            );
        });

    await Promise.all(promises);

    pypy.exec(
`
import pint.compat
ureg = pint.UnitRegistry('default_en.txt')
Q = ureg.Quantity

print 3 * ureg.meter + 4 * ureg.cm
`)

})();

// export
// class PintRegistry {

//     get ready() { return pypy.isReady(); }
    
//     covert(val, from, to) {

//         window.

//     }

// }