import { useEffect, useRef, useState } from 'react';

// Visor de foto 360° (imagen equirectangular 2:1) hecho con WebGL, sin librerías.
// Por cada píxel de la pantalla calcula hacia dónde mira la cámara y toma ese punto de la foto.
// Arrastrar: mirar alrededor · rueda o pellizco: zoom · botón: pantalla completa.

const VERTICES = `
attribute vec2 pos;
varying vec2 uv;
void main() {
    uv = pos;
    gl_Position = vec4(pos, 0.0, 1.0);
}`;

const FRAGMENTOS = `
precision highp float;
varying vec2 uv;
uniform sampler2D foto;
uniform float giro;      // izquierda-derecha (radianes)
uniform float inclina;   // arriba-abajo (radianes)
uniform float tanMedia;  // tan(campo de visión / 2)
uniform float aspecto;   // ancho / alto del lienzo
const float PI = 3.141592653589793;
void main() {
    vec3 d = normalize(vec3(uv.x * tanMedia * aspecto, uv.y * tanMedia, -1.0));
    float ci = cos(inclina), si = sin(inclina);
    d = vec3(d.x, d.y * ci - d.z * si, d.y * si + d.z * ci);
    float cg = cos(giro), sg = sin(giro);
    d = vec3(d.x * cg - d.z * sg, d.y, d.x * sg + d.z * cg);
    float lon = atan(d.x, -d.z);
    float lat = asin(clamp(d.y, -1.0, 1.0));
    gl_FragColor = texture2D(foto, vec2(fract(lon / (2.0 * PI) + 0.5), 0.5 - lat / PI));
}`;

const CAMPO_MIN = 35, CAMPO_MAX = 100, CAMPO_INICIAL = 80; // grados
const LIMITE_INCLINACION = (85 * Math.PI) / 180;

interface Props {
    src: string;
    titulo: string;
}

export default function Vista360({ src, titulo }: Props) {
    const contenedor = useRef<HTMLDivElement>(null);
    const lienzo = useRef<HTMLCanvasElement>(null);
    const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');
    const [tocada, setTocada] = useState(false); // tras el primer toque se detiene el giro automático

    useEffect(() => {
        const canvas = lienzo.current;
        if (!canvas) return;
        const gl = canvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: false });
        if (!gl) {
            setEstado('error');
            return;
        }

        // ---------- programa ----------
        const compilar = (tipo: number, fuente: string) => {
            const s = gl.createShader(tipo)!;
            gl.shaderSource(s, fuente);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error('[Vista360] shader:', gl.getShaderInfoLog(s));
            return s;
        };
        const programa = gl.createProgram()!;
        gl.attachShader(programa, compilar(gl.VERTEX_SHADER, VERTICES));
        gl.attachShader(programa, compilar(gl.FRAGMENT_SHADER, FRAGMENTOS));
        gl.linkProgram(programa);
        if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
            // La tarjeta gráfica no aceptó el programa: mejor un aviso que un recuadro en blanco
            console.error('[Vista360] programa:', gl.getProgramInfoLog(programa));
            setEstado('error');
            return;
        }
        gl.useProgram(programa);
        gl.clearColor(0.06, 0.1, 0.08, 1);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // un triángulo cubre la pantalla
        const pos = gl.getAttribLocation(programa, 'pos');
        gl.enableVertexAttribArray(pos);
        gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
        const u = {
            giro: gl.getUniformLocation(programa, 'giro'),
            inclina: gl.getUniformLocation(programa, 'inclina'),
            tanMedia: gl.getUniformLocation(programa, 'tanMedia'),
            aspecto: gl.getUniformLocation(programa, 'aspecto'),
        };

        // ---------- vista ----------
        const vista = { giro: 0, inclina: 0, campo: CAMPO_INICIAL, auto: true };
        let cuadro = 0;
        let lista = false;

        const dibujar = () => {
            cuadro = 0;
            if (!lista) return;
            const ratio = Math.min(window.devicePixelRatio || 1, 2);
            const ancho = Math.round(canvas.clientWidth * ratio);
            const alto = Math.round(canvas.clientHeight * ratio);
            if (canvas.width !== ancho || canvas.height !== alto) {
                canvas.width = ancho;
                canvas.height = alto;
            }
            if (ancho === 0 || alto === 0) return; // todavía sin tamaño: el ResizeObserver vuelve a llamar
            gl.viewport(0, 0, ancho, alto);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(u.giro, vista.giro);
            gl.uniform1f(u.inclina, vista.inclina);
            gl.uniform1f(u.tanMedia, Math.tan(((vista.campo * Math.PI) / 180) / 2));
            gl.uniform1f(u.aspecto, ancho / Math.max(alto, 1));
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            const fallo = gl.getError();
            if (fallo !== gl.NO_ERROR) console.error('[Vista360] error de WebGL al dibujar:', fallo);
            if (vista.auto) {
                vista.giro += 0.0015;
                pedirCuadro();
            }
        };
        const pedirCuadro = () => {
            if (!cuadro) cuadro = requestAnimationFrame(dibujar);
        };

        // ---------- foto ----------
        const imagen = new Image();
        imagen.decoding = 'async';
        imagen.onload = () => {
            if (!imagen.naturalWidth) {
                setEstado('error');
                return;
            }
            // Los celulares no aceptan texturas muy grandes: si la foto pasa del máximo, se reduce
            const maximo = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, 8192);
            let fuente: TexImageSource = imagen;
            if (imagen.naturalWidth > maximo) {
                const reducida = document.createElement('canvas');
                reducida.width = maximo;
                reducida.height = Math.round((imagen.naturalHeight * maximo) / imagen.naturalWidth);
                reducida.getContext('2d')!.drawImage(imagen, 0, 0, reducida.width, reducida.height);
                fuente = reducida;
            }
            const textura = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, textura);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, fuente);
            // Sin mipmaps y sin repetir: así funciona con fotos de cualquier tamaño
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            console.info(`[Vista360] foto ${imagen.naturalWidth}×${imagen.naturalHeight}, máximo de textura ${maximo}`);
            lista = true;
            setEstado('lista');
            pedirCuadro();
        };
        imagen.onerror = () => {
            console.error('[Vista360] no se pudo cargar la foto:', src);
            setEstado('error');
        };
        const contextoPerdido = (e: Event) => {
            e.preventDefault();
            console.error('[Vista360] la tarjeta gráfica cerró el contexto de WebGL');
            setEstado('error');
        };
        canvas.addEventListener('webglcontextlost', contextoPerdido);
        imagen.src = src;

        // ---------- interacción ----------
        const punteros = new Map<number, { x: number; y: number }>();
        let distanciaPellizco = 0;

        const detenerAuto = () => {
            if (vista.auto) {
                vista.auto = false;
                setTocada(true);
            }
        };
        const zoom = (factor: number) => {
            vista.campo = Math.min(CAMPO_MAX, Math.max(CAMPO_MIN, vista.campo * factor));
            pedirCuadro();
        };
        const distancia = () => {
            const [a, b] = [...punteros.values()];
            return Math.hypot(a.x - b.x, a.y - b.y);
        };

        const alPresionar = (e: PointerEvent) => {
            detenerAuto();
            canvas.setPointerCapture(e.pointerId);
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 2) distanciaPellizco = distancia();
        };
        const alMover = (e: PointerEvent) => {
            const anterior = punteros.get(e.pointerId);
            if (!anterior) return;
            if (punteros.size === 1) {
                // Arrastrar la foto: lo que se arrastra a la derecha se va a la derecha
                const radPorPixel = ((vista.campo * Math.PI) / 180) / Math.max(canvas.clientHeight, 1);
                vista.giro -= (e.clientX - anterior.x) * radPorPixel;
                vista.inclina = Math.max(-LIMITE_INCLINACION, Math.min(LIMITE_INCLINACION, vista.inclina + (e.clientY - anterior.y) * radPorPixel));
            }
            punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
            if (punteros.size === 2) {
                const actual = distancia();
                if (distanciaPellizco > 0) zoom(distanciaPellizco / actual);
                distanciaPellizco = actual;
            }
            pedirCuadro();
        };
        const alSoltar = (e: PointerEvent) => {
            punteros.delete(e.pointerId);
            distanciaPellizco = 0;
        };
        const alRueda = (e: WheelEvent) => {
            e.preventDefault();
            detenerAuto();
            zoom(e.deltaY > 0 ? 1.08 : 1 / 1.08);
        };
        const alTeclado = (e: KeyboardEvent) => {
            const paso = 0.08;
            if (e.key === 'ArrowLeft') vista.giro -= paso;
            else if (e.key === 'ArrowRight') vista.giro += paso;
            else if (e.key === 'ArrowUp') vista.inclina = Math.min(LIMITE_INCLINACION, vista.inclina + paso);
            else if (e.key === 'ArrowDown') vista.inclina = Math.max(-LIMITE_INCLINACION, vista.inclina - paso);
            else if (e.key === '+' || e.key === '=') zoom(1 / 1.1);
            else if (e.key === '-') zoom(1.1);
            else return;
            e.preventDefault();
            detenerAuto();
            pedirCuadro();
        };

        canvas.addEventListener('pointerdown', alPresionar);
        canvas.addEventListener('pointermove', alMover);
        canvas.addEventListener('pointerup', alSoltar);
        canvas.addEventListener('pointercancel', alSoltar);
        canvas.addEventListener('wheel', alRueda, { passive: false });
        canvas.addEventListener('keydown', alTeclado);
        const observador = new ResizeObserver(pedirCuadro);
        observador.observe(canvas);

        return () => {
            cancelAnimationFrame(cuadro);
            observador.disconnect();
            canvas.removeEventListener('pointerdown', alPresionar);
            canvas.removeEventListener('pointermove', alMover);
            canvas.removeEventListener('pointerup', alSoltar);
            canvas.removeEventListener('pointercancel', alSoltar);
            canvas.removeEventListener('wheel', alRueda);
            canvas.removeEventListener('keydown', alTeclado);
            canvas.removeEventListener('webglcontextlost', contextoPerdido);
            imagen.onload = null;
            gl.getExtension('WEBGL_lose_context')?.loseContext();
        };
    }, [src]);

    function pantallaCompleta() {
        const el = contenedor.current;
        if (!el) return;
        if (document.fullscreenElement) void document.exitFullscreen();
        else void el.requestFullscreen?.();
    }

    return (
        <div className="vista360" ref={contenedor}>
            <canvas
                ref={lienzo}
                tabIndex={0}
                role="img"
                aria-label={`Foto 360° de ${titulo}. Arrastra o usa las flechas para mirar alrededor.`}
            />
            {estado === 'cargando' && <span className="vista360-aviso">Cargando vista 360°…</span>}
            {estado === 'error' && <span className="vista360-aviso">No se pudo mostrar la foto 360° en este navegador.</span>}
            {estado === 'lista' && (
                <>
                    <span className="vista360-etiqueta">360°</span>
                    {!tocada && <span className="vista360-pista">Arrastra para mirar alrededor</span>}
                    <button type="button" className="vista360-completa" onClick={pantallaCompleta} aria-label="Ver en pantalla completa">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                        </svg>
                    </button>
                </>
            )}
        </div>
    );
}
