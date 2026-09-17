import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/vendor',{recursive:true});
await copyFile('node_modules/manifold-3d/manifold.wasm','public/vendor/manifold.wasm');
await copyFile('node_modules/manifold-3d/LICENSE','public/vendor/manifold-LICENSE.txt');
