// HU-02, criterio 3 (Sprint Planning del 27/10/2026):
// «Al tocar un lote vendido no se abre su ficha y aparece el aviso "Ese lote ya está vendido"».
// Esta prueba se escribió ANTES que el código de src/utils/seleccion.ts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alTocarLote } from '../src/utils/seleccion.ts';
import type { EstadoLote, Lote } from '../src/types/lote.ts';

function lote(estado: EstadoLote): Lote {
    return { id: 'A-1', manzana: 'A', numero: 1, areaM2: 200, precio: 95_000_000, estado, descripcion: '' };
}

test('HU-02 c3: un lote vendido no abre la ficha y muestra el aviso', () => {
    assert.deepEqual(alTocarLote(lote('VENDIDO'), false), {
        abrirFicha: false,
        aviso: 'Ese lote ya está vendido',
    });
});

test('HU-03 c1: un lote disponible abre la ficha sin aviso', () => {
    assert.deepEqual(alTocarLote(lote('DISPONIBLE'), false), { abrirFicha: true, aviso: null });
});

test('HU-03 c1: un lote reservado abre la ficha sin aviso', () => {
    assert.deepEqual(alTocarLote(lote('RESERVADO'), false), { abrirFicha: true, aviso: null });
});

test('el vendedor sí abre un lote vendido (lo necesita para cambiarle el estado)', () => {
    assert.deepEqual(alTocarLote(lote('VENDIDO'), true), { abrirFicha: true, aviso: null });
});
