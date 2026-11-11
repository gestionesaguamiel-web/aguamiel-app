# Aplica v382 (sabores en el paquete) sobre v381. Uso: python v382.py "<carpeta Codigo de la app>"
import sys, os, hashlib
d = sys.argv[1]
def rd(n): return open(os.path.join(d, n), encoding='utf-8', newline='').read()
def wr(n, s): open(os.path.join(d, n), 'w', encoding='utf-8', newline='').write(s)
def sha(n): return hashlib.sha1(open(os.path.join(d, n), 'rb').read()).hexdigest()
assert sha('Index.html') == 'e76bbe099fb18ef4633676098c64a2e7faa1f759', 'Index.html no es la v381'
assert sha('Codigo.gs') == '8fc374b0a1d33f1e0e098997519eba186c8bc86f', 'Codigo.gs no es la v381'
h = rd('Index.html')
def rep(s, o, n):
    assert s.count(o) == 1, o[:60]
    return s.replace(o, n)
h = rep(h, '  // "ErroresApp" con el teléfono y la pantalla donde ocurrió. Sirve para encontrar y corregir el origen.\n  const FALLAS = { enviadas:0, ultimas:{}, version: \'v381\' };', '  // "ErroresApp" con el teléfono y la pantalla donde ocurrió. Sirve para encontrar y corregir el origen.\n  const FALLAS = { enviadas:0, ultimas:{}, version: \'v382\' };')
h = rep(h, "      '📦 En cada presupuesto: botón <strong>«Presentar como paquete»</strong>. Le pones un nombre y la hoja, el PDF y el WhatsApp salen resumidos (ej. <em>9 × Masaje antiestrés</em>), sin «Adulto 1, Adulto 2…».',\n      '👥 Arriba sale el <strong>precio del paquete por persona</strong> y el total del grupo. El total cobrado no cambia.' ] }", "      '📦 En cada presupuesto: botón <strong>«Presentar como paquete»</strong>. Le pones un nombre y la hoja, el PDF y el WhatsApp salen resumidos (ej. <em>9 × Masaje antiestrés</em>), sin «Adulto 1, Adulto 2…».',\n      '👥 Arriba sale el <strong>precio del paquete por persona</strong> y el total del grupo. El total cobrado no cambia.' ] },\n    { v:382, fecha:'11 nov', titulo:'🥤 Sabores en el paquete', puntos:[\n      '🥤 En el presupuesto como paquete, los jugos y platos muestran lo elegido entre paréntesis, ej. <em>2 × Jugo Natural (Parchita, Melón)</em>.' ] }")
h = rep(h, "      const k = (it.tipo==='comida' ? 'c|' : 's|') + desc.toLowerCase();\n      if(!mapa[k]){ mapa[k] = { desc, cant:0, grupo, comida: it.tipo==='comida' }; orden.push(k); }", "      const k = (it.tipo==='comida' ? 'c|' : 's|') + desc.toLowerCase();\n      if(!mapa[k]){ mapa[k] = { desc, cant:0, grupo, comida: it.tipo==='comida', ops:[] }; orden.push(k); }")
h = rep(h, '      mapa[k].cant += Number(it.cantidad)||1; if(grupo) mapa[k].grupo = true;', "      mapa[k].cant += Number(it.cantidad)||1; if(grupo) mapa[k].grupo = true;\n      // v382: sabores u opciones elegidas (ej. Jugo natural (parchita, melón))\n      (it.opciones||[]).forEach(o=>{ const v = String(o).split('::').pop().trim(); if(v && !mapa[k].ops.some(x=>x.toLowerCase()===v.toLowerCase())) mapa[k].ops.push(v); });")
h = rep(h, "  }\n  function lineaPaquete(x){ return (x.grupo ? '' : x.cant + ' × ') + x.desc + (x.grupo ? ' (para todo el grupo)' : ''); }", "  }\n  function lineaPaquete(x){ return (x.grupo ? '' : x.cant + ' × ') + x.desc + (x.ops && x.ops.length ? ' (' + x.ops.join(', ') + ')' : '') + (x.grupo ? ' (para todo el grupo)' : ''); }")
wr('Index.html', h)
c = rd('Codigo.gs')
c = rep(c, 'var _AUTH_SISTEMA = null;   // solo el propio servidor lo crea (para leer Atención hoy en nombre de administración)\nvar NOVEDADES_ULTIMA = 381;  // número de la última actualización publicada en «🆕 Actualizaciones de la app»', 'var _AUTH_SISTEMA = null;   // solo el propio servidor lo crea (para leer Atención hoy en nombre de administración)\nvar NOVEDADES_ULTIMA = 382;  // número de la última actualización publicada en «🆕 Actualizaciones de la app»')
c = rep(c, "    'En cada presupuesto hay un botón nuevo: «📦 Presentar como paquete». Le pones un nombre y la hoja, el PDF y el WhatsApp salen resumidos (ej. 9 × Masaje antiestrés), sin «Adulto 1, Adulto 2…».',\n    'Arriba sale el precio del paquete por persona y el total para el grupo. El total cobrado no cambia.' ] }", "    'En cada presupuesto hay un botón nuevo: «📦 Presentar como paquete». Le pones un nombre y la hoja, el PDF y el WhatsApp salen resumidos (ej. 9 × Masaje antiestrés), sin «Adulto 1, Adulto 2…».',\n    'Arriba sale el precio del paquete por persona y el total para el grupo. El total cobrado no cambia.' ] },\n  { v:382, titulo:'Sabores en el paquete', texto:[\n    'En el presupuesto como paquete, los jugos y platos muestran lo elegido entre paréntesis, ej. 2 × Jugo Natural (Parchita, Melón).' ] }")
wr('Codigo.gs', c)
print('Index.html', sha('Index.html')); print('Codigo.gs', sha('Codigo.gs'))
assert sha('Index.html') == 'e674d25576ae18a942d6ce0a6131b2de3bd438b5'
assert sha('Codigo.gs') == 'dec00fc5b92d5dbbd6099fffc5365d64567064ea'
print('OK v382 aplicada')
