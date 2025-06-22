'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Clinica extends Model {
    static associate(models) {
      // Asociación con GrupoClinica: cada clínica puede pertenecer a un grupo (opcional)
      Clinica.belongsTo(models.GrupoClinica, { foreignKey: 'grupoClinicaId', as: 'grupoClinica' });
      // Asociación muchos a muchos con Usuario a través de la tabla pivote UsuarioClinica
      Clinica.belongsToMany(models.Usuario, { through: 'UsuarioClinica', foreignKey: 'id_clinica' });
    }
  }
  Clinica.init({
    id_clinica: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    url_web: DataTypes.STRING,
    url_avatar: DataTypes.STRING,
    url_fondo: DataTypes.STRING,
    url_ficha_local: DataTypes.STRING,
    nombre_clinica: DataTypes.STRING,
    fecha_creacion: DataTypes.DATE,
    id_publicidad_meta: DataTypes.INTEGER,
    url_publicidad_meta: DataTypes.INTEGER,
    filtro_pc_meta: DataTypes.INTEGER,
    id_publicidad_google: DataTypes.INTEGER,
    url_publicidad_google: DataTypes.INTEGER,
    filtro_pc_google: DataTypes.INTEGER,
    servicios: DataTypes.STRING,
    checklist: DataTypes.STRING,
    estado_clinica: DataTypes.BOOLEAN,
    datos_fiscales_clinica: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // Nuevo campo para asociar a un grupo de clínicas (opcional)
    grupoClinicaId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Clinica',
    tableName: 'Clinicas',
    timestamps: false
  });
  return Clinica;
};
