(async () => {

    function writeFile(name, dir, content) {

        console.log(`adding '${ name }' in '${ dir }'`);
        const script = 
`
import os
LIB_PATH = "${ dir }"

script = """${ content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') }"""
dir = os.path.join(LIB_PATH, "${ name }")

with open(dir, "w") as f:
    f.write(script)

`;

        return pypyjs.exec(script);
        
    }

    function defineModule(name, content) {

        return writeFile(name, '/lib/pypyjs/lib_pypy/', content);

    }

    console.log('Waiting for pypyjs to be ready...');
    await pypyjs.ready();
    console.log('Ready...');

    pypyjs.exec(
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

    pypyjs.exec(
`
import pint.compat
ureg = pint.UnitRegistry('default_en.txt')
print 3 * ureg.meter + 4 * ureg.cm
`)


})();