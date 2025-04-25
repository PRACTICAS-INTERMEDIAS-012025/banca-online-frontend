export interface LoginResponse {
  usuario: Usuario;
}

export interface Usuario {
  UID:      number;
  username: string;
  email:    string;
  persona:  Persona;
  rol:      Rol;
}

export interface Persona {
  UID:        number;
  nombre:     string;
  apellido:   string;
  nacimiento: Date;
  direccion:  string;
  sexo:       string;
  telefono:   number;
  dPi:        string;
}

export interface Rol {
  UID:    number;
  nombre: string;
}
export interface Cuenta {
  UID: number;
  numero: number;      
  saldo: string;        
  creacion: string;     
  tipoCuenta: 1 | 2;    // 1: Monetaria, 2: Ahorros
  usuario: number;      
  estado: string;      
  moneda?: string;    
}
export interface CuentaAceptar {
  UID: number;
  numero: number;
  creacion: string;
  tipoCuenta: number;
  estado: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  dPi: string;
}