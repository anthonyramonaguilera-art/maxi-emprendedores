// Mensajes específicos por evento
export const eventosMensajes = {
  receta_guardada: {
    mensaje: (data) => `¡Excelente! Has creado ${data.nombre || 'una receta'}. Ahora a compartirlo con otros. Recuerda que el trabajo honrado es una bendición.`,
    versiculo: '“El que labra su tierra se saciará de pan; mas el que sigue a los ociosos se llenará de pobreza.” (Proverbios 28:19)',
  },
  venta_realizada: {
    mensaje: () => '¡Venta registrada! Cada peso que ganas con honestidad es fruto de tu esfuerzo. ¡Sigue así!',
    versiculo: '“Las riquezas de vanidad disminuirán; pero el que recoge con mano laboriosa las aumenta.” (Proverbios 13:11)',
  },
  primera_venta_dia: {
    mensaje: () => '¡Has comenzado el día con ventas! El Señor bendice el trabajo de tus manos. ¡Ánimo!',
    versiculo: '“El alma del perezoso desea, y nada alcanza; mas el alma de los diligentes será prosperada.” (Proverbios 13:4)',
  },
  racha_alcanzada: {
    mensaje: (data) => `¡Felicidades! Llevas ${data.dias || 'varios'} días seguidos vendiendo. La fidelidad en lo poco te llevará a grandes cosas.`,
    versiculo: '“El que en poco es fiel, también en mucho es fiel.” (Lucas 16:10)',
  },
  producto_estrella: {
    mensaje: (data) => `¡Tu producto estrella es ${data.nombre || 'este producto'}! Aprovecha su éxito y produce más. Dios multiplica la semilla que siembras con diligencia.`,
    versiculo: '“El que siembra escasamente, también segará escasamente; y el que siembra generosamente, generosamente también segará.” (2 Corintios 9:6)',
  },
  stock_bajo: {
    mensaje: (data) => `Te quedan pocos ${data.nombre || 'insumos'}. Una hormiga prepara en el verano su comida. ¡Reabastece a tiempo!`,
    versiculo: '“Anda, perezoso, mira a la hormiga, mira sus caminos, y sé sabio; la cual no teniendo capitán, ni gobernador, ni señor, prepara en el verano su comida, y recoge en el tiempo de la siega su mantenimiento.” (Proverbios 6:6-8)',
  },
  fiado_cobrado: {
    mensaje: (data) => `¡Has recuperado $${data.monto || '0.00'}! La honestidad y la justicia en los negocios traen paz al corazón.`,
    versiculo: '“No codicies la hacienda de tu prójimo, ni ninguna cosa que sea de tu prójimo.” (Éxodo 20:17)',
  },
  tasa_desactualizada: {
    mensaje: () => 'La tasa oficial ha cambiado. Actualiza tu configuración para no perder en tus cálculos. El sabio prevé el peligro y se aparta.',
    versiculo: '“El sabio teme y se aparta del mal; mas el necio se muestra insolente y confiado.” (Proverbios 14:16)',
  },
  usuario_inactivo: {
    mensaje: () => '¡Te extrañé! Retoma tu negocio con alegría. Nunca es tarde para empezar de nuevo.',
    versiculo: '“No te deleites en el sueño, para que no te empobrezcas; abre tus ojos, y te saciarás de pan.” (Proverbios 20:13)',
  },
  racha_perdida: {
  mensaje: () => 'No te preocupes. Cada día es una nueva oportunidad. El Señor renueva sus misericordias cada mañana.',
  versiculo: '“Nuevas son cada mañana; grande es tu fidelidad.” (Lamentaciones 3:22-23)',
},
};

// Consejos del día (para cuando el usuario hace clic en Maxi sin eventos)
export const consejosDia = [
  { texto: 'Ordena tus gastos y verás la bendición del orden.', versiculo: '“Pero hágase todo decentemente y con orden.” (1 Corintios 14:40)' },
  { texto: 'Da gracias por cada venta, por pequeña que sea.', versiculo: '“Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús.” (1 Tesalonicenses 5:18)' },
  { texto: 'Comparte tus conocimientos con otros emprendedores.', versiculo: '“Hierro con hierro se aguza; y así el hombre aguza el rostro de su amigo.” (Proverbios 27:17)' },
  { texto: 'Descansa un día a la semana, tu cuerpo y mente lo necesitan.', versiculo: '“Acuérdate del día de reposo para santificarlo.” (Éxodo 20:8-10)' },
  { texto: 'Invierte en mejorar tus recetas, la excelencia honra a Dios.', versiculo: '“Y todo lo que hagáis, hacedlo de corazón, como para el Señor.” (Colosenses 3:23)' },
];