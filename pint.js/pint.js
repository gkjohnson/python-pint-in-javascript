/* globals pypyjs */
import dd from './dedent.js';

const pypy =
    new pypyjs({
        stdin: pypyjs._defaultStdin,
        stdout: pypyjs._defaultStdout,
        stderr: pypyjs._defaultStderr,
    });

window.pypy = pypy;

function writeFile(name, dir, content) {

    let makeDir = `${ dir }/${ name }`.replace(/\/+/g, '/').split('/');
    makeDir.pop();
    makeDir = makeDir.join('/');
    const script =
        dd`
        import os

        dir = os.path.join("${ dir }", "${ name }")
        try:
            os.makedirs("${ makeDir }")
        except:
            pass

        script = """${ content.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') }"""

        with open(dir, "w") as f:
            f.write(script)

        `;

    return pypy.exec(script);

}

function defineModule(name, content) {

    return writeFile(name, '/lib/pypyjs/lib_pypy/', content);

}

(async() => {

    await pypy.ready();

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
        dd`
        import pint.compat
        ureg = pint.UnitRegistry('default_en.txt')
        Q = ureg.Quantity

        print 3 * ureg.meter + 4 * ureg.cm
        `);

})();

// export
// class PintRegistry {

//     get ready() { return pypy.isReady(); }

//     covert(val, from, to) {

//         window.

//     }

// }
