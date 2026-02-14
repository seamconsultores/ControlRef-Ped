export type UserRole = 'admin' | 'operador' | 'socio' | 'director';

export type PedimentoStatus = 'BORRADOR' | 'VALIDADO' | 'PAGADO' | 'ANULADO';

export type TipoOperacion = 'IMP' | 'EXP';

export interface Pedimento {
    id: string; // UUID
    referencia: string; // Unique: AA-AAA-PPPP-CNNNNNN
    aduana: string; // 3 chars
    patente: string; // 4 chars
    numero_pedimento: string; // 7 chars + check digits
    cliente: string;
    proveedor: string;
    tipo_operacion: TipoOperacion;
    clave_pedimento: string;
    caja: string;
    placas: string;
    es_inbond: boolean;
    estado: PedimentoStatus;
    usuario_id: string; // UUID
    created_at: string; // ISO String
    updated_at: string; // ISO String
}

export interface Consecutivo {
    id: number;
    anio: string; // 2 chars
    aduana: string; // 3 chars
    patente: string; // 4 chars
    siguiente_secuencia: number;
    updated_at: string;
}

export interface PedimentoFormData {
    aduana: string;
    patente: string;
    cliente: string;
    proveedor: string;
    tipo_operacion: TipoOperacion;
    clave_pedimento: string;
    caja: string;
    placas: string;
    es_inbond: boolean;
}
