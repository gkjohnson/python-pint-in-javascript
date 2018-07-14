/* globals pypyjs */
import dd from './dedent.js';

const pypy =
    new pypyjs({
        stdin: pypyjs._defaultStdin,
        stdout: pypyjs._defaultStdout,
        stderr: pypyjs._defaultStderr,
    });

let isReady = false;

function escape(value) {

    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

}

function execNow(code) {

    if (isReady === false) {

        throw new Error('Pypy environment is not ready');

    }
    pypy._execute_source(`exec """${ escape(code) }""" in top_level_scope.__dict__`);

}

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

(async() => {

    await pypy.ready();

    const promises = [];

    const modules = await fetch('./modules.json').then(res => res.json());
    Object
        .keys(modules)
        .forEach(name => {
            promises.push(
                fetch(modules[name])
                    .then(res => res.text())
                    .then(res => writeFile(name, '/lib/pypyjs/lib_pypy/', res))
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
        import js
        import pint.compat
        ureg = pint.UnitRegistry('default_en.txt')
        Q = ureg.Quantity
        `);

    isReady = true;

})();

export default
class PintRegistry {

    get ready() { return isReady; }
    get pypy() { return pypy; }

    covert(val, from, to) {

        let res = null;
        let errmsg = null;
        window.__valFunc__ = (val, err) => {
            res = val;
            errmsg = err;
        };

        execNow(dd`
        try:
            res = Q(${ val }, "${ from }").to("${ to }")
            js.eval("__valFunc__({ value:" + str(res.magnitude) + ", units:\\"" + str(res.units) + "\\" }, null)")
        except Exception as e:
            js.eval("__valFunc__(null, \\"" + str(e) + "\\")")
        `);

        delete window.__valFunc__;

        if (errmsg) throw new Error(errmsg);

        return res;

    }

}
