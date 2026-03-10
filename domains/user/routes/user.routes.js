const { Router } = require("express");
const {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} = require("../controller/user.controller");
const autenticacao = require("../../../middleware/autenticacao");
const {
  autorizarPerfis,
  verificarProprioUsuarioOuAdmin,
} = require("../../../middleware/autorizacao");
const { audit } = require('../../../middleware/audit');

const userRoutes = Router();

userRoutes.get("/", autenticacao, autorizarPerfis("admin"), listUsers);
userRoutes.get("/:id", autenticacao, verificarProprioUsuarioOuAdmin, getUserById);
userRoutes.post("/", autenticacao, autorizarPerfis("admin"), audit('user.create', 'users', 'high'), createUser);
userRoutes.put("/:id", autenticacao, verificarProprioUsuarioOuAdmin, audit('user.update', 'users', 'medium'), updateUser);
userRoutes.delete("/:id", autenticacao, autorizarPerfis("admin"), audit('user.delete', 'users', 'high'), deleteUser);

module.exports = userRoutes;
