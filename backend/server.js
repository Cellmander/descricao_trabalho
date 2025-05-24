const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const User = require('./models/User');
const Code = require('./models/Code');

const app = express();

app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://seu-dominio.com' 
        : 'http://localhost:8080', 
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.'
    }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
})
.catch((error) => {
    console.error('❌ Erro ao conectar no MongoDB:', error);
    process.exit(1);
});

app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Backend funcionando!', 
        timestamp: new Date().toISOString() 
    });
});

app.get('/api/test-models', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const codeCount = await Code.countDocuments();
        
        res.json({ 
            message: 'Modelos funcionando!',
            collections: {
                users: userCount,
                codes: codeCount
            },
            timestamp: new Date().toISOString() 
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao testar modelos', 
            details: error.message 
        });
    }
});

app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada' 
    });
});

app.use((error, req, res, next) => {
    console.error('Erro no servidor:', error);
    res.status(500).json({ 
        error: 'Erro interno do servidor' 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📍 Acesse: http://localhost:${PORT}/api/test`);
});