export default function(tokens, ...args) {

    let res = tokens[0];
    for (let i = 1, l = tokens.length; i < l; i++) {

        res += args[i - 1] + tokens[i];

    }

    res = res.replace(/^\n+/, '');

    const indent = res.match(/^( |\t)*/g)[0];
    const indentRegexp = new RegExp(`^${ indent }`, 'gm');
    return res.replace(indentRegexp, '\n');

}
