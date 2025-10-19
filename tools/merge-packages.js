const fs = require('fs').promises;
const path = require('path');

async function walk(dir, list = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
        if (e.name === 'node_modules' || e.name === '.git') continue;
        const res = path.resolve(dir, e.name);
        if (e.isDirectory()) await walk(res, list);
        else if (e.isFile() && e.name === 'package.json') list.push(res);
    }
    return list;
}

function ensure(obj, key) {
    if (!obj[key]) obj[key] = {};
    return obj[key];
}

async function fileExists(p) {
    try { await fs.access(p); return true; } catch { return false; }
}

(async () => {
    const toolsDir = path.dirname(__filename);
    const repoRoot = path.resolve(toolsDir, '..');
    const rootPkgPath = path.join(repoRoot, 'package.json');

    if (!await fileExists(rootPkgPath)) {
        console.error('No se encontró package.json en la raíz:', rootPkgPath);
        process.exit(1);
    }

    const allPkgPaths = await walk(repoRoot);
    const subPkgPaths = allPkgPaths.filter(p => path.resolve(p) !== path.resolve(rootPkgPath));

    if (subPkgPaths.length === 0) {
        console.log('No se encontraron package.json adicionales. Nada que fusionar.');
        process.exit(0);
    }

    // Leer root package.json
    const rootRaw = await fs.readFile(rootPkgPath, 'utf8');
    const rootPkg = JSON.parse(rootRaw);

    // Backup root
    await fs.writeFile(rootPkgPath + '.bak', rootRaw, 'utf8');

    const conflicts = [];
    const movedScripts = [];
    const touchedFiles = [];

    for (const subPath of subPkgPaths) {
        const relDir = path.relative(repoRoot, path.dirname(subPath)).replace(/\\/g, '/');
        const raw = await fs.readFile(subPath, 'utf8');
        const subPkg = JSON.parse(raw);

        // Backups
        await fs.writeFile(subPath + '.bak', raw, 'utf8');
        const subLock = path.join(path.dirname(subPath), 'package-lock.json');
        if (await fileExists(subLock)) {
            const lockRaw = await fs.readFile(subLock, 'utf8');
            await fs.writeFile(subLock + '.bak', lockRaw, 'utf8');
            touchedFiles.push(subLock);
        }
        touchedFiles.push(subPath);

        // Merge dependencies
        const rootDeps = ensure(rootPkg, 'dependencies');
        const rootDev = ensure(rootPkg, 'devDependencies');
        const subDeps = subPkg.dependencies || {};
        const subDev = subPkg.devDependencies || {};

        for (const [k,v] of Object.entries(subDeps)) {
            if (!rootDeps[k]) rootDeps[k] = v;
            else if (rootDeps[k] !== v) conflicts.push({ type: 'dependency', package: relDir, name: k, root: rootDeps[k], other: v });
        }
        for (const [k,v] of Object.entries(subDev)) {
            if (!rootDev[k]) rootDev[k] = v;
            else if (rootDev[k] !== v) conflicts.push({ type: 'devDependency', package: relDir, name: k, root: rootDev[k], other: v });
        }

        // Merge scripts
        rootPkg.scripts = rootPkg.scripts || {};
        const subScripts = subPkg.scripts || {};
        for (const [name, scriptCmd] of Object.entries(subScripts)) {
            if (!rootPkg.scripts[name]) {
                // create a proxy script that runs the subpackage script via npm --prefix
                rootPkg.scripts[name] = `npm --prefix ./` + relDir + ` run ` + name;
                movedScripts.push({ from: `${relDir}:${name}`, to: name });
            } else if (rootPkg.scripts[name] !== scriptCmd) {
                // create a namespaced script
                const newName = `${relDir.replace(/\//g, ':')}:${name}`;
                rootPkg.scripts[newName] = `npm --prefix ./` + relDir + ` run ` + name;
                conflicts.push({ type: 'script', package: relDir, name, rootScript: rootPkg.scripts[name], otherScript: scriptCmd, promotedTo: newName });
            }
        }
    }

    // Attach conflicts summary into root package.json under _mergedConflicts for visibility (optional)
    if (conflicts.length > 0) {
        rootPkg._mergedConflicts = conflicts;
    }

    // Write updated root package.json
    await fs.writeFile(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');

    console.log('FUSIÓN COMPLETADA. Resumen:');
    console.log('- Backups creados (.bak) para cada package.json y package-lock.json donde existían.');
    console.log('- Archivos tocados:');
    touchedFiles.forEach(f => console.log('  -', f));
    console.log('- Conflictos detectados:', conflicts.length);
    if (conflicts.length > 0) {
        console.log('  Revisa package.json raíz en la llave "_mergedConflicts" y los archivos *.bak para resolver versiones manualmente.');
        conflicts.slice(0,50).forEach(c => console.log('   •', c));
    }
    console.log('- Scripts movidos/creados (proxy):', movedScripts.length);
    movedScripts.slice(0,50).forEach(s => console.log('   •', s));
    console.log('\nSiguientes pasos recomendados:');
    console.log('1) Revisa y confirma package.json raíz. Si estás de acuerdo, ejecuta en la raíz: npm install');
    console.log('2) Si todo funciona, elimina manualmente los package.json y package-lock.json de los subdirectorios listados arriba (se crearon .bak por seguridad).');
    console.log('3) Si quieres que el script elimine automáticamente, vuelve a ejecutarlo con la opción --prune (no implementado por seguridad).');

})().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});