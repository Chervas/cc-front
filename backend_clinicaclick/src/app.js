require('dotenv').config();
const cors = require('cors');
const express = require('express');

const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const clinicaRoutes = require('./routes/clinica.routes');
const servicioRoutes = require('./routes/servicio.routes');
const clinicaServicioRoutes = require('./routes/clinicaservicio.route');
const historialDeServiciosRoutes = require('./routes/historialdeservicios.route');
const gruposClinicasRoutes = require('./routes/gruposclinicas.routes');
const pacienteRoutes = require('./routes/paciente.routes');

const app = express();

const corsOptions = {
    origin: 'http://localhost:4200'
};

app.use(cors(corsOptions));
app.use(express.json());

console.log('Configurando rutas...');
app.use('/api/users', userRoutes);
console.log('Ruta /api/users configurada');
app.use('/api/clinicas', clinicaRoutes);
console.log('Ruta /api/clinicas configurada');
app.use('/api/auth', authRoutes);
console.log('Ruta /api/auth configurada');
app.use('/api/servicios', servicioRoutes);
console.log('Ruta /api/servicios configurada');
app.use('/api/clinicaservicio', clinicaServicioRoutes);
console.log('Ruta /api/clinicaservicio configurada');
app.use('/api/historialdeservicios', historialDeServiciosRoutes);
console.log('Ruta /api/historialdeservicios configurada');
// Registrar la ruta de grupos (todo en minúsculas)
app.use('/api/gruposclinicas', gruposClinicasRoutes);
console.log('Ruta /api/gruposclinicas configurada');
app.use('/api/pacientes', pacienteRoutes);
console.log('Ruta /api/pacientes configurada');

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
