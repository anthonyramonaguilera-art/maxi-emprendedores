import { atom } from 'nanostores';

export const carritoStore = atom([]);

export function agregarProducto(producto) {
  if (!producto || !producto.id) {
    console.error('Producto inválido para agregar al carrito', producto);
    return;
  }
  const carrito = carritoStore.get();
  const existe = carrito.find(i => i.id === producto.id);
  if (existe) {
    if (existe.cantidadSeleccionada >= producto.stock_actual) {
      console.warn('Stock máximo alcanzado para', producto.nombre);
      return;
    }
    carritoStore.set(carrito.map(i =>
      i.id === producto.id ? { ...i, cantidadSeleccionada: i.cantidadSeleccionada + 1 } : i
    ));
  } else {
    carritoStore.set([...carrito, { ...producto, cantidadSeleccionada: 1 }]);
  }
  console.log('Carrito actualizado:', carritoStore.get());
}

export function modificarCantidadCarrito(id, delta) {
  const carrito = carritoStore.get();
  carritoStore.set(
    carrito.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidadSeleccionada + delta;
        if (nuevaCant <= 0) return null;
        if (nuevaCant > item.stock_actual) return item;
        return { ...item, cantidadSeleccionada: nuevaCant };
      }
      return item;
    }).filter(Boolean)
  );
}

export function vaciarCarritoStore() {
  carritoStore.set([]);
}