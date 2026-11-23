// Red de seguridad para refactorizar validar(): describe lo que la función HACE HOY,
// rama por rama. Si después del refactor alguna de estas pruebas cambia de resultado,
// el refactor cambió el comportamiento y no es un refactor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar } from '../src/utils/validacionLote.ts';
import type { Campos } from '../src/utils/validacionLote.ts';
import { TAMANO_MAXIMO_VIDEO } from '../src/config/video.ts';

const validos: Campos = { manzana: 'B2', numero: '7', precio: '95000000', estado: 'DISPONIBLE', descripcion: '' };
const con = (cambios: Partial<Campos>): Campos => ({ ...validos, ...cambios });
const video = (name: string, size = 1024) => ({ name, size }) as File;

test('datos válidos: sin errores, al crear y al editar', () => {
    assert.deepEqual(validar(validos, true, null), {});
    assert.deepEqual(validar(validos, false, null), {});
});

test('manzana: letras o números, de 1 a 5, sin contar espacios de los extremos', () => {
    assert.equal(validar(con({ manzana: ' A ' }), true, null).manzana, undefined);
    assert.equal(validar(con({ manzana: 'ABCDE' }), true, null).manzana, undefined);
    for (const mala of ['', 'ABCDEF', 'A-1', 'Ñ']) {
        assert.equal(validar(con({ manzana: mala }), true, null).manzana, 'Letras o números, máximo 5 (ej. A, B2).', mala);
    }
});

test('número: entero entre 1 y 9999', () => {
    for (const bueno of ['1', '9999']) assert.equal(validar(con({ numero: bueno }), true, null).numero, undefined);
    for (const malo of ['0', '10000', '2.5', 'abc']) {
        assert.equal(validar(con({ numero: malo }), true, null).numero, 'Número entero entre 1 y 9999.', malo);
    }
});

test('al editar no se validan manzana ni número (no se pueden cambiar)', () => {
    assert.deepEqual(validar(con({ manzana: '', numero: '0' }), false, null), {});
});

test('precio: obligatorio, numérico y no negativo (0 se acepta)', () => {
    assert.equal(validar(con({ precio: '0' }), false, null).precio, undefined);
    for (const malo of ['', '   ', '-1', 'abc', 'Infinity']) {
        assert.equal(validar(con({ precio: malo }), false, null).precio, 'Escribe el precio en pesos.', malo);
    }
});

test('descripción: máximo 1000 caracteres', () => {
    assert.equal(validar(con({ descripcion: 'x'.repeat(1000) }), false, null).descripcion, undefined);
    assert.equal(validar(con({ descripcion: 'x'.repeat(1001) }), false, null).descripcion, 'Máximo 1000 caracteres.');
});

test('video: solo MP4 o WebM (sin importar mayúsculas) y hasta 300 MB', () => {
    assert.equal(validar(validos, false, video('recorrido.MP4')).video, undefined);
    assert.equal(validar(validos, false, video('recorrido.webm', TAMANO_MAXIMO_VIDEO)).video, undefined);
    assert.equal(validar(validos, false, video('recorrido.mov')).video, 'Sube el video en MP4 o WebM.');
    assert.equal(
        validar(validos, false, video('recorrido.mp4', TAMANO_MAXIMO_VIDEO + 1)).video,
        'El video supera 300 MB. Recórtalo o comprímelo.',
    );
});

test('el formato se revisa antes que el tamaño', () => {
    assert.equal(validar(validos, false, video('grande.avi', TAMANO_MAXIMO_VIDEO + 1)).video, 'Sube el video en MP4 o WebM.');
});

test('varios errores a la vez se reportan juntos', () => {
    const errores = validar(con({ manzana: '', numero: '0', precio: '', descripcion: 'x'.repeat(1001) }), true, video('a.mov'));
    assert.deepEqual(Object.keys(errores).sort(), ['descripcion', 'manzana', 'numero', 'precio', 'video']);
});
