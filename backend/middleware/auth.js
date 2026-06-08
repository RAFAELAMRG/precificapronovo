const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Acesso negado. Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Formato de token inválido. Use "Bearer <token>".' });
    }

    const secret = process.env.JWT_SECRET || 'precificapro_secret_token_123456_super_secure';
    const decoded = jwt.verify(token, secret);
    
    // Inject user details in request
    req.user = {
      id: decoded.id,
      company_id: decoded.company_id,
      nome: decoded.nome,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token de autenticação inválido ou expirado.' });
  }
};
