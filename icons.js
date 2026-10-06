const drawings={
 wood:'<path fill="#553625" d="M2 8h15v10H2zM7 4h15v9H7z"/><path fill="#a5733d" d="M3 9h13v7H3zM8 5h13v6H8z"/><path fill="#d0ad69" d="M14 9h5v7h-5zM19 5h4v6h-4z"/><path fill="#765235" d="M15 11h2v3h-2zM20 7h1v2h-1z"/><path stroke="#6b452e" d="M4 11h8M8 7h9M5 14h7"/>',
 stone:'<path fill="#354943" d="M3 17 6 8l7-4 7 7 2 7-8 4z"/><path fill="#7e9081" d="m5 16 3-7 5-3 6 6-6 7z"/><path fill="#b7bea0" d="m8 9 5-3 4 4-5 4z"/><path fill="#566b5e" d="m13 19 6-7 2 6-7 3z"/>',
 berry:'<path fill="#4e682f" d="M9 4h8v3h-8zM11 2h3v6h-3z"/><path fill="#8eb75a" d="M14 3h6v3h-6z"/><path fill="#393458" d="M3 10h8v10H3zM11 7h9v11h-9zM10 15h10v7H10z"/><path fill="#a75fa1" d="M4 11h6v7H4zM12 8h7v8h-7zM11 16h7v5h-7z"/><path fill="#e0aac5" d="M5 11h3v2H5zM13 9h3v2h-3zM12 17h3v2h-3z"/>',
 carrot:'<path fill="#3f763a" d="M6 2h3v6H6zM15 1h3v6h-3zM10 4h4v5h-4z"/><path fill="#9460a3" d="M5 9h15v7H5zM8 16h10v4H8zM11 20h4v3h-4z"/><path fill="#d4b3d3" d="M6 9h13v4H6zM8 13h6v3H8z"/>',
 wheat:'<path fill="#96712c" d="M10 3h3v19h-3z"/><path fill="#ebc969" d="M7 3h4v4H7zM13 5h4v4h-4zM6 8h5v4H6zM13 11h5v4h-5zM6 14h5v4H6z"/><path fill="#bda54d" d="M4 19h6v2H4zM14 18h7v2h-7z"/>',
 seed:'<path fill="#694f2c" d="M4 7h16v15H4z"/><path fill="#d0b98a" d="M5 8h14v12H5z"/><path fill="#38693c" d="M10 13h3v6h-3zM7 11h5v4H7zM12 9h5v4h-5z"/><path fill="#f0d6a4" d="M6 5h12v4H6z"/>',
 axe:'<path fill="#553d28" d="m5 20 2 2L19 7l-3-2z"/><path fill="#9baea0" d="m10 3 4-2 8 6-6 6-4-4z"/><path fill="#d4ddd0" d="m10 3 4-2 4 3-5 4z"/>',
 pickaxe:'<path stroke="#714b2d" stroke-width="3" d="m7 22 8-16"/><path fill="#a5b8a7" d="m4 5 5-4h8l6 7-2 2-7-5-8 3z"/><path fill="#d7e0c9" d="m9 2 8 1 4 4-6-3-9 3z"/>',
 hoe:'<path fill="#724b30" d="M10 4h3v19h-3z"/><path fill="#9bb2a1" d="M4 2h15v5H4zM4 6h5v5H4z"/><path fill="#d0dbbb" d="M4 2h15v2H4z"/>',
 watering_can:'<path fill="#4b8f9a" d="M5 10h12v11H5zM16 13h4l3-4 1 4-5 6h-3z"/><path fill="none" stroke="#6dbcc3" stroke-width="3" d="M6 10V5h8v5"/><path fill="#9dd6ca" d="M6 10h10v3H6zM7 14h2v5H7z"/>',
 hand:'<path fill="#d6b585" d="M6 10h3V4h3v8h1V2h3v10h1V5h3v9h1V8h3v9l-6 6H9l-6-7v-5z"/>',
 gold:'<path fill="#8e672c" d="M7 2h10l5 5v10l-5 5H7l-5-5V7z"/><path fill="#e9c568" d="M8 3h8l5 5v8l-5 5H8l-5-5V8z"/><path fill="#fff0ac" d="M8 5h8v3H8zM5 8h3v7H5z"/><path fill="#b28937" d="M10 9h4v8h-4z"/>',
};
export function iconSvg(id){const key=id.endsWith('_seed')?'seed':id;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" shape-rendering="crispEdges" aria-hidden="true">${drawings[key]||drawings.hand}</svg>`;}
export function iconURL(id){return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(iconSvg(id));}
