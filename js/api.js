/* --- Business Logic & Calculation Layer --- */
import { db, PLANS, MARKETPLACES } from './db.js';

const SESSION_KEY = "precificapro_session";

// Helpers to generate IDs
const genId = (prefix = 'id') => `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

export const api = {
    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================
    login(email, password) {
        const users = db.get("users");
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return { success: false, message: "E-mail ou senha incorretos." };
        }
        if (user.senha !== password) {
            return { success: false, message: "E-mail ou senha incorretos." };
        }
        if (user.status === "bloqueado") {
            return { success: false, message: "Esta conta está suspensa. Entre em contato com o suporte." };
        }

        // Save session
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
        
        // Log action
        this.addLog(user.id, "Login efetuado no sistema", `Usuário ${user.nome} fez login.`);

        return { success: true, user };
    },

    logout() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            this.addLog(currentUser.id, "Logout efetuado", `Usuário ${currentUser.nome} deslogou.`);
        }
        sessionStorage.removeItem(SESSION_KEY);
        return { success: true };
    },

    register(name, email, password) {
        const users = db.get("users");
        
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: "Este e-mail já está cadastrado no sistema." };
        }

        const newUser = {
            id: genId('u'),
            nome: name,
            email: email,
            senha: password,
            tipo: "cliente",
            status: "ativo",
            created_at: new Date().toISOString()
        };

        const newSub = {
            id: genId('s'),
            user_id: newUser.id,
            plano: "pro",
            status: "ativo",
            vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days
        };

        // Save to DB
        users.push(newUser);
        db.set("users", users);

        const subs = db.get("subscriptions");
        subs.push(newSub);
        db.set("subscriptions", subs);

        // Auto login
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
        
        this.addLog(newUser.id, "Conta criada", `Cadastro inicial efetuado no Plano Bronze.`);

        return { success: true, user: newUser };
    },

    recoverPassword(email) {
        const users = db.get("users");
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return { success: false, message: "E-mail não encontrado." };
        }

        // Simulate password recovery email
        this.addLog(user.id, "Recuperação de senha solicitada", `Instruções enviadas para ${email}`);
        return { success: true, message: `Instruções de recuperação enviadas para o e-mail: ${email}` };
    },

    getCurrentUser() {
        const session = sessionStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    // ==========================================
    // LOGS LOGGER HELPERS
    // ==========================================
    addLog(userId, action, details) {
        const logs = db.get("logs");
        const newLog = {
            id: genId('l'),
            user_id: userId,
            acao: action,
            detalhes: details,
            created_at: new Date().toISOString()
        };
        logs.unshift(newLog); // Put on top
        db.set("logs", logs.slice(0, 100)); // Limit to last 100
    },

    // ==========================================
    // ADMIN DASHBOARD METHODS
    // ==========================================
    getAdminDashboardMetrics() {
        const users = db.get("users").filter(u => u.tipo === "cliente");
        const subs = db.get("subscriptions");
        
        const totalClients = users.length;
        const activeClients = users.filter(u => u.status === "ativo").length;
        const blockedClients = users.filter(u => u.status === "bloqueado").length;
        
        // Compute MRR based on active subscriptions
        let mrr = 0;
        subs.forEach(s => {
            if (s.status === "ativo") {
                const price = PLANS[s.plano]?.price || 0;
                mrr += price;
            }
        });

        // Compute simulated monthly revenues
        const monthlyBilling = mrr * 0.95; // Subtract imaginary payment fees
        
        // Counts
        const newSignups = users.filter(u => {
            const signupDate = new Date(u.created_at);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return signupDate > oneMonthAgo;
        }).length;

        // Simulated online users (static randomized value for SaaS visual effect)
        const onlineUsers = Math.floor(Math.random() * 8) + 2; 
        
        return {
            totalClients,
            activeClients,
            blockedClients,
            mrr: mrr.toFixed(2),
            monthlyBilling: monthlyBilling.toFixed(2),
            newSignups,
            onlineUsers,
            growthRate: "+12.4%" // Visual indicator
        };
    },

    getClients() {
        const users = db.get("users").filter(u => u.tipo === "cliente");
        const subs = db.get("subscriptions");
        
        return users.map(u => {
            const sub = subs.find(s => s.user_id === u.id) || { plano: "Nenhum", status: "Inativo", vencimento: "-" };
            return {
                id: u.id,
                nome: u.nome,
                email: u.email,
                status: u.status,
                created_at: u.created_at,
                plano: sub.plano,
                status_assinatura: sub.status,
                vencimento: sub.vencimento
            };
        });
    },

    blockClient(userId) {
        const users = db.get("users");
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].status = "bloqueado";
            db.set("users", users);
            
            // Mark subscription as delinquent
            const subs = db.get("subscriptions");
            const subIndex = subs.findIndex(s => s.user_id === userId);
            if (subIndex !== -1) {
                subs[subIndex].status = "inadimplente";
                db.set("subscriptions", subs);
            }

            const currentUser = this.getCurrentUser();
            this.addLog(currentUser?.id || "admin", "Cliente bloqueado", `Cliente ${users[userIndex].nome} (${users[userIndex].email}) bloqueado pelo administrador.`);
            return { success: true };
        }
        return { success: false, message: "Cliente não encontrado." };
    },

    unblockClient(userId) {
        const users = db.get("users");
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].status = "ativo";
            db.set("users", users);
            
            // Activate subscription
            const subs = db.get("subscriptions");
            const subIndex = subs.findIndex(s => s.user_id === userId);
            if (subIndex !== -1) {
                subs[subIndex].status = "ativo";
                db.set("subscriptions", subs);
            }

            const currentUser = this.getCurrentUser();
            this.addLog(currentUser?.id || "admin", "Cliente desbloqueado", `Cliente ${users[userIndex].nome} (${users[userIndex].email}) desbloqueado.`);
            return { success: true };
        }
        return { success: false, message: "Cliente não encontrado." };
    },

    changeClientPlan(userId, planId) {
        const subs = db.get("subscriptions");
        const subIndex = subs.findIndex(s => s.user_id === userId);
        if (subIndex !== -1) {
            const oldPlan = subs[subIndex].plano;
            subs[subIndex].plano = planId;
            db.set("subscriptions", subs);

            const users = db.get("users");
            const user = users.find(u => u.id === userId);
            
            const currentUser = this.getCurrentUser();
            this.addLog(currentUser?.id || "admin", "Alteração de Plano", `Plano de ${user?.nome || 'Cliente'} alterado de ${oldPlan} para ${planId}.`);
            return { success: true };
        }
        return { success: false, message: "Assinatura não encontrada." };
    },

    resetClientPassword(userId, newPassword) {
        const users = db.get("users");
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].senha = newPassword;
            db.set("users", users);

            const currentUser = this.getCurrentUser();
            this.addLog(currentUser?.id || "admin", "Senha de Cliente Resetada", `Senha do cliente ${users[userIndex].nome} redefinida pelo administrador.`);
            return { success: true };
        }
        return { success: false, message: "Cliente não encontrado." };
    },

    getSystemLogs() {
        const logs = db.get("logs");
        const users = db.get("users");
        
        return logs.map(l => {
            const u = users.find(usr => usr.id === l.user_id);
            return {
                ...l,
                usuario_nome: u ? u.nome : "Sistema",
                usuario_email: u ? u.email : ""
            };
        });
    },

    // ==========================================
    // CLIENT PRICING CALCULATOR LOGIC
    // ==========================================
    calculateMargin(custo, frete, precoVenda, mktId) {
        const settings = db.get("marketplace_settings");
        const rules = (settings && settings[mktId]) || MARKETPLACES[mktId] || { percentFee: 0, flatFee: 0, freeShippingThreshold: 0 };
        
        const costFloat = parseFloat(custo) || 0;
        const shippingFloat = parseFloat(frete) || 0;
        const sellPriceFloat = parseFloat(precoVenda) || 0;
        
        if (sellPriceFloat <= 0) return { profit: 0, margin: 0, fees: 0 };
        
        // Fee breakdown calculation
        const percentFee = sellPriceFloat * ((rules.percentFee || 0) / 100);
        
        // Only apply flat fee if sale is below free shipping or generally (marketplace standard rules)
        // Many marketplaces charge fixed flat fees e.g. R$ 5,00/item
        const fixedFee = rules.flatFee || 0;
        const totalFees = percentFee + fixedFee;
        
        const totalCost = costFloat + shippingFloat + totalFees;
        const profit = sellPriceFloat - totalCost;
        const margin = (profit / sellPriceFloat) * 100;
        
        return {
            fees: totalFees.toFixed(2),
            profit: profit.toFixed(2),
            margin: margin.toFixed(1)
        };
    },

    suggestPriceForDesiredMargin(custo, frete, desiredMarginPercent, mktId) {
        const settings = db.get("marketplace_settings");
        const rules = (settings && settings[mktId]) || MARKETPLACES[mktId] || { percentFee: 0, flatFee: 0, freeShippingThreshold: 0 };
        
        const costFloat = parseFloat(custo) || 0;
        const shippingFloat = parseFloat(frete) || 0;
        const targetMargin = parseFloat(desiredMarginPercent) || 0;
        
        const percentFeeRate = (rules.percentFee || 0) / 100;
        
        // Formula derivation:
        // P = Custo + Frete + (P * percentFeeRate) + flatFee + (P * (targetMargin/100))
        // P * (1 - percentFeeRate - targetMargin/100) = Custo + Frete + flatFee
        // P = (Custo + Frete + flatFee) / (1 - percentFeeRate - targetMargin/100)
        
        const numerator = costFloat + shippingFloat + rules.flatFee;
        const denominator = 1 - percentFeeRate - (targetMargin / 100);
        
        if (denominator <= 0) return 0;
        
        const suggested = numerator / denominator;
        return suggested.toFixed(2);
    },

    // ==========================================
    // CLIENT PRODUCTS METHODS
    // ==========================================
    getProducts(userId) {
        const products = db.get("products");
        return products.filter(p => p.user_id === userId);
    },

    getProduct(productId) {
        const products = db.get("products");
        return products.find(p => p.id === productId);
    },

    saveProduct(productData) {
        const products = db.get("products");
        const currentUserId = this.getCurrentUser()?.id;
        
        if (!currentUserId) return { success: false, message: "Sessão expirada." };

        // Verify product limit if Ouro/Bronze plan
        const subs = db.get("subscriptions");
        const sub = subs.find(s => s.user_id === currentUserId);
        const planLimit = PLANS[sub?.plano || 'pro'].maxProducts;
        const userProductsCount = products.filter(p => p.user_id === currentUserId).length;

        if (!productData.id && userProductsCount >= planLimit) {
            return { 
                success: false, 
                message: `Limite de produtos atingido para o plano ${PLANS[sub.plano].name.toUpperCase()} (${planLimit} produtos).` 
            };
        }

        // Perform calculation to store values
        const costFloat = parseFloat(productData.custo) || 0;
        const shippingFloat = parseFloat(productData.frete) || 0;
        const sellPriceFloat = parseFloat(productData.preco_atual) || 0;
        
        const calc = this.calculateMargin(costFloat, shippingFloat, sellPriceFloat, productData.marketplace);

        const newProd = {
            id: productData.id || genId('p'),
            user_id: currentUserId,
            nome: productData.nome,
            sku: productData.sku,
            marketplace: productData.marketplace,
            custo: costFloat,
            frete: shippingFloat,
            taxas: parseFloat(calc.fees),
            margem: parseFloat(calc.margin),
            preco_atual: sellPriceFloat,
            created_at: productData.id ? (this.getProduct(productData.id)?.created_at || new Date().toISOString()) : new Date().toISOString()
        };

        if (productData.id) {
            const index = products.findIndex(p => p.id === productData.id && p.user_id === currentUserId);
            if (index !== -1) {
                products[index] = newProd;
            } else {
                return { success: false, message: "Produto não encontrado." };
            }
        } else {
            products.push(newProd);
        }

        db.set("products", products);

        // Proactively generate/delete alerts based on profit margins!
        this.updateAlertsForProduct(newProd);

        this.addLog(
            currentUserId, 
            productData.id ? "Produto editado" : "Produto cadastrado", 
            `Produto '${newProd.nome}' SKU: ${newProd.sku} precificado para ${MARKETPLACES[newProd.marketplace].name} por R$ ${newProd.preco_atual.toFixed(2)}.`
        );

        return { success: true, product: newProd };
    },

    deleteProduct(productId) {
        const products = db.get("products");
        const currentUserId = this.getCurrentUser()?.id;
        
        const prod = products.find(p => p.id === productId && p.user_id === currentUserId);
        if (!prod) return { success: false, message: "Produto não encontrado." };

        const updatedProducts = products.filter(p => p.id !== productId || p.user_id !== currentUserId);
        db.set("products", updatedProducts);

        // Delete alerts corresponding to this product
        const alerts = db.get("alerts");
        const filteredAlerts = alerts.filter(a => !(a.user_id === currentUserId && a.mensagem.includes(`(SKU: ${prod.sku})`)));
        db.set("alerts", filteredAlerts);

        this.addLog(currentUserId, "Produto excluído", `Produto '${prod.nome}' SKU: ${prod.sku} foi removido.`);
        return { success: true };
    },

    updateAlertsForProduct(prod) {
        const alerts = db.get("alerts");
        
        // Remove existing alerts for this SKU first
        let updatedAlerts = alerts.filter(a => !(a.user_id === prod.user_id && a.mensagem.includes(`(SKU: ${prod.sku})`)));
        
        // Add new alerts if margins are negative
        if (prod.margem < 0) {
            const newAlert = {
                id: genId('a'),
                user_id: prod.user_id,
                tipo: "prejuizo",
                mensagem: `O produto '${prod.nome}' (SKU: ${prod.sku}) está com margem negativa (${prod.margem}%) no ${MARKETPLACES[prod.marketplace].name}. Risco de prejuízo por venda!`,
                status: "nao_lido",
                created_at: new Date().toISOString()
            };
            updatedAlerts.unshift(newAlert);
        } else if (prod.margem > 0 && prod.margem < 5) {
            const newAlert = {
                id: genId('a'),
                user_id: prod.user_id,
                tipo: "taxa",
                mensagem: `Atenção: '${prod.nome}' (SKU: ${prod.sku}) está com margem muito baixa (${prod.margem}%) no ${MARKETPLACES[prod.marketplace].name}.`,
                status: "nao_lido",
                created_at: new Date().toISOString()
            };
            updatedAlerts.unshift(newAlert);
        }

        db.set("alerts", updatedAlerts);
    },

    // ==========================================
    // CLIENT ALERTS METHODS
    // ==========================================
    getAlerts(userId) {
        const alerts = db.get("alerts");
        return alerts.filter(a => a.user_id === userId);
    },

    markAlertsAsRead(userId) {
        const alerts = db.get("alerts");
        const updated = alerts.map(a => {
            if (a.user_id === userId) {
                return { ...a, status: "lido" };
            }
            return a;
        });
        db.set("alerts", updated);
        return { success: true };
    },

    // ==========================================
    // CLIENT MARKETPLACE CUSTOM FEES SETTINGS
    // ==========================================
    getMarketplaceSettings() {
        return db.get("marketplace_settings");
    },

    saveMarketplaceSettings(settings) {
        db.set("marketplace_settings", settings);
        
        // Re-compute all margins for all products to reflect changes in taxes!
        const currentUserId = this.getCurrentUser()?.id;
        if (currentUserId) {
            const products = db.get("products");
            const updated = products.map(p => {
                if (p.user_id === currentUserId) {
                    const calc = this.calculateMargin(p.custo, p.frete, p.preco_atual, p.marketplace);
                    const prodUpdate = {
                        ...p,
                        taxas: parseFloat(calc.fees),
                        margem: parseFloat(calc.margin)
                    };
                    this.updateAlertsForProduct(prodUpdate);
                    return prodUpdate;
                }
                return p;
            });
            db.set("products", updated);
            
            this.addLog(currentUserId, "Ajuste de taxas", "As configurações de taxas dos marketplaces foram atualizadas.");
        }
        return { success: true };
    },

    addMarketplace(name, percentFee, flatFee, freeShippingThreshold) {
        const settings = this.getMarketplaceSettings();
        const mktId = name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9]+/g, '_') // Replace spaces/special chars with underscores
            .trim()
            .replace(/^_+|_+$/g, ''); // Trim underscores
            
        if (!mktId) {
            return { success: false, message: "Nome de marketplace inválido." };
        }
        
        if (settings[mktId]) {
            return { success: false, message: "Um marketplace com este nome já existe." };
        }

        const newMkt = {
            id: mktId,
            name: name,
            percentFee: parseFloat(percentFee) || 0,
            flatFee: parseFloat(flatFee) || 0,
            freeShippingThreshold: parseFloat(freeShippingThreshold) || 0
        };

        settings[mktId] = newMkt;
        db.set("marketplace_settings", settings);

        const currentUserId = this.getCurrentUser()?.id;
        if (currentUserId) {
            this.addLog(currentUserId, "Marketplace adicionado", `Canal customizado '${name}' cadastrado com comissão de ${percentFee}%.`);
        }

        return { success: true, marketplace: newMkt };
    },

    getClientDashboardMetrics(userId) {
        const products = this.getProducts(userId);
        const alerts = this.getAlerts(userId);
        
        const totalProducts = products.length;
        const profitableProducts = products.filter(p => p.margem > 0).length;
        const lossProducts = products.filter(p => p.margem < 0).length;
        
        let marginSum = 0;
        let estimatedProfit = 0;
        
        // Sum values
        products.forEach(p => {
            marginSum += p.margem;
            
            // Assume 15 items sold monthly per SKU on average to construct realistic monthly profit
            const profitPerItem = p.preco_atual - (p.custo + p.frete + p.taxas);
            estimatedProfit += profitPerItem * 15; 
        });

        const averageMargin = totalProducts > 0 ? (marginSum / totalProducts).toFixed(1) : 0;
        const unreadAlerts = alerts.filter(a => a.status === "nao_lido").length;

        // Marketplace performance distribution
        const mktProfitMap = {};
        products.forEach(p => {
            const profitPerItem = p.preco_atual - (p.custo + p.frete + p.taxas);
            if (!mktProfitMap[p.marketplace]) {
                mktProfitMap[p.marketplace] = 0;
            }
            mktProfitMap[p.marketplace] += profitPerItem;
        });

        let bestMkt = "Nenhum";
        let bestMktProfit = -Infinity;
        Object.entries(mktProfitMap).forEach(([mkt, profit]) => {
            if (profit > bestMktProfit) {
                bestMktProfit = profit;
                bestMkt = MARKETPLACES[mkt]?.name || mkt;
            }
        });

        if (totalProducts === 0) bestMkt = "Sem produtos";

        return {
            totalProducts,
            profitableProducts,
            lossProducts,
            averageMargin,
            estimatedProfit: estimatedProfit.toFixed(2),
            unreadAlerts,
            bestMarketplace: bestMkt
        };
    },

    getIntegrations() {
        const data = localStorage.getItem("precificapro_integrations");
        return data ? JSON.parse(data) : {
            shein: { connected: false, username: "" },
            shopee: { connected: false, username: "" },
            mercado_livre: { connected: false, username: "" },
            tiktok_shop: { connected: false, username: "" },
            bling: { connected: false, username: "" }
        };
    },

    saveIntegrations(integrations) {
        localStorage.setItem("precificapro_integrations", JSON.stringify(integrations));
    },

    connectIntegration(mktId, username) {
        const integrations = this.getIntegrations();
        integrations[mktId] = { connected: true, username: username };
        this.saveIntegrations(integrations);

        const currentUserId = this.getCurrentUser()?.id;
        if (currentUserId) {
            this.addLog(currentUserId, "Conexão de Canal", `Integração com o marketplace ${mktId.toUpperCase()} vinculada com a conta '${username}'.`);
        }
        return { success: true };
    },

    disconnectIntegration(mktId) {
        const integrations = this.getIntegrations();
        const oldUser = integrations[mktId].username;
        integrations[mktId] = { connected: false, username: "" };
        this.saveIntegrations(integrations);

        const currentUserId = this.getCurrentUser()?.id;
        
        if (currentUserId) {
            const products = db.get("products");
            if (mktId === 'bling') {
                // Delete products imported via Bling ERP
                const filtered = products.filter(p => !(p.user_id === currentUserId && p.source === 'bling'));
                db.set("products", filtered);
                this.addLog(currentUserId, "Desconexão de ERP", `Integração com o ERP Bling (${oldUser}) foi desconectada.`);
            } else {
                // Filter out products imported from this channel
                const filtered = products.filter(p => !(p.user_id === currentUserId && p.marketplace === mktId && p.imported));
                db.set("products", filtered);
                
                // Re-sync alerts
                const alerts = db.get("alerts");
                const filteredAlerts = alerts.filter(a => !(a.user_id === currentUserId && a.mensagem.includes(`no ${mktId.toUpperCase()}`) && a.mensagem.includes("Risco de prejuízo")));
                db.set("alerts", filteredAlerts);

                this.addLog(currentUserId, "Desconexão de Canal", `Integração com o canal ${mktId.toUpperCase()} (${oldUser}) foi desconectada.`);
            }
        }
        return { success: true };
    },

    syncIntegrationProducts(mktId) {
        const currentUserId = this.getCurrentUser()?.id;
        if (!currentUserId) return { success: false, message: "Sessão expirada." };

        const products = db.get("products");
        const existingSkus = new Set(products.filter(p => p.user_id === currentUserId).map(p => p.sku));

        // Define mock imports with incorrect prices
        const mockImports = {
            shopee: [
                { nome: "Fone Bluetooth JBL Tune 510", sku: "JBL-T510-MOCK", custo: 130.00, frete: 15.00, preco_atual: 155.00, imported: true } // Comissão Shopee 20% (R$31.00) + R$4.00 = R$35.00. Custos: 130+15+35=180. Lucro: 155-180 = -R$25.00 Prejuízo!
            ],
            mercado_livre: [
                { nome: "Caixa de Som Inteligente Alexa Echo Dot", sku: "ALX-ECHO-MOCK", custo: 180.00, frete: 25.00, preco_atual: 220.00, imported: true } // Comissão ML 12% (R$26.40) + R$6.00 = R$32.40. Custos: 180+25+32.40 = 237.40. Lucro: 220-237.40 = -R$17.40 Prejuízo!
            ],
            shein: [
                { nome: "Bolsa Transversal Couro Sintético", sku: "SHN-BOLS-MOCK", custo: 45.00, frete: 10.00, preco_atual: 55.00, imported: true } // Comissão Shein 14% (R$7.70) + R$3.00 = R$10.70. Custos: 45+10+10.70 = 65.70. Lucro: 55-65.70 = -R$10.70 Prejuízo!
            ],
            tiktok_shop: [
                { nome: "Kit Microfone de Lapela Wireless", sku: "TT-MIC-MOCK", custo: 60.00, frete: 12.00, preco_atual: 75.00, imported: true } // Comissão TikTok 15% (R$11.25) + R$2.00 = R$13.25. Custos: 60+12+13.25 = 85.25. Lucro: 75-85.25 = -R$10.25 Prejuízo!
            ]
        };

        const imports = mockImports[mktId] || [];
        let addedCount = 0;

        imports.forEach(item => {
            // Avoid duplicates
            if (!existingSkus.has(item.sku)) {
                // Calculate fees and margins dynamically
                const calc = this.calculateMargin(item.custo, item.frete, item.preco_atual, mktId);
                
                const newProd = {
                    id: `p-${Math.random().toString(36).substr(2, 9)}`,
                    user_id: currentUserId,
                    nome: item.nome,
                    sku: item.sku,
                    marketplace: mktId,
                    custo: item.custo,
                    frete: item.frete,
                    taxas: parseFloat(calc.fees),
                    margem: parseFloat(calc.margin),
                    preco_atual: item.preco_atual,
                    created_at: new Date().toISOString(),
                    imported: true // Flag to show it's an API integration sync product
                };

                products.push(newProd);
                this.updateAlertsForProduct(newProd);
                addedCount++;
            }
        });

        db.set("products", products);

        if (addedCount > 0) {
            this.addLog(currentUserId, "Sincronização concluída", `Puxou ${addedCount} novos anúncios da integração ${mktId.toUpperCase()} com comissões defasadas.`);
        }

        return { success: true, count: addedCount };
    },

    syncPriceCorrection(productId, newPrice) {
        const products = db.get("products");
        const currentUserId = this.getCurrentUser()?.id;
        
        const idx = products.findIndex(p => p.id === productId && p.user_id === currentUserId);
        if (idx === -1) return { success: false, message: "Produto não encontrado." };

        const prod = products[idx];
        const oldPrice = prod.preco_atual;
        
        // Recalculate margins
        const calc = this.calculateMargin(prod.custo, prod.frete, newPrice, prod.marketplace);
        
        prod.preco_atual = parseFloat(newPrice);
        prod.taxas = parseFloat(calc.fees);
        prod.margem = parseFloat(calc.margin);
        
        products[idx] = prod;
        db.set("products", products);
        
        // Re-sync alerts for this product
        this.updateAlertsForProduct(prod);

        this.addLog(
            currentUserId, 
            "Preço corrigido via API", 
            `Enviado comando PUT de preço para canal ${prod.marketplace.toUpperCase()} no SKU: ${prod.sku}. Atualizado de R$ ${oldPrice.toFixed(2)} para R$ ${parseFloat(newPrice).toFixed(2)} (Margem: ${prod.margem}%).`
        );

        return { success: true, product: prod };
    },

    // ==========================================
    // CLIENT ORDERS (VENDA A VENDA) METHODS
    // ==========================================
    getOrders(userId) {
        const orders = db.get("orders");
        return orders.filter(o => o.user_id === userId);
    },

    // ==========================================
    // CLIENT ADS PERFORMANCE METHODS
    // ==========================================
    getAdsCampaigns(userId) {
        const campaigns = db.get("ads_campaigns");
        return campaigns.filter(c => c.user_id === userId);
    },

    getAdsSummary(userId) {
        const campaigns = this.getAdsCampaigns(userId);
        const orders = this.getOrders(userId).filter(o => o.status !== "cancelado");
        
        let totalSpend = 0;
        let totalAttributedRevenue = 0;
        let totalClicks = 0;
        
        campaigns.forEach(c => {
            totalSpend += c.investimento;
            totalAttributedRevenue += c.faturamento_atribuido;
            totalClicks += c.cliques;
        });

        // Total sales from orders to calculate TACOS
        let totalSalesRevenue = 0;
        orders.forEach(o => {
            totalSalesRevenue += o.preco_venda;
        });

        // Calculate metrics
        const acos = totalAttributedRevenue > 0 ? (totalSpend / totalAttributedRevenue) * 100 : 0;
        const tacos = totalSalesRevenue > 0 ? (totalSpend / totalSalesRevenue) * 100 : 0;
        const roas = totalSpend > 0 ? totalAttributedRevenue / totalSpend : 0;

        return {
            totalSpend: totalSpend.toFixed(2),
            totalAttributedRevenue: totalAttributedRevenue.toFixed(2),
            totalClicks,
            acos: acos.toFixed(1),
            tacos: tacos.toFixed(1),
            roas: roas.toFixed(2),
            totalSalesRevenue: totalSalesRevenue.toFixed(2)
        };
    },

    updateCampaignBudget(userId, campaignId, newBudget) {
        const campaigns = db.get("ads_campaigns");
        const idx = campaigns.findIndex(c => c.id === campaignId && c.user_id === userId);
        
        if (idx === -1) return { success: false, message: "Campanha não encontrada." };
        
        const campaign = campaigns[idx];
        const oldBudget = campaign.investimento;
        const budgetFloat = parseFloat(newBudget) || 0;
        
        // Calculate dynamic scaling ratios based on original values to keep ROI realistic
        const clicksRatio = oldBudget > 0 ? campaign.cliques / oldBudget : 1.5;
        const revRatio = oldBudget > 0 ? campaign.faturamento_atribuido / oldBudget : 4.0;
        
        campaign.investimento = budgetFloat;
        campaign.cliques = Math.round(budgetFloat * clicksRatio);
        campaign.faturamento_atribuido = parseFloat((budgetFloat * revRatio).toFixed(2));
        
        campaigns[idx] = campaign;
        db.set("ads_campaigns", campaigns);
        
        this.addLog(userId, "Orçamento de campanha alterado", `Campanha '${campaign.nome}' ajustada de R$ ${oldBudget.toFixed(2)} para R$ ${budgetFloat.toFixed(2)}.`);
        
        return { success: true, campaign };
    },

    // ==========================================
    // CLIENT BLING ERP INTEGRATION METHODS
    // ==========================================
    syncBlingProducts(userId) {
        const currentUserId = userId || this.getCurrentUser()?.id;
        if (!currentUserId) return { success: false, message: "Sessão expirada." };

        const products = db.get("products");
        const existingSkusAndMkts = new Set(products.filter(p => p.user_id === currentUserId).map(p => `${p.sku}_${p.marketplace}`));

        const mockBlingSkus = [
            {
                nome: "Headset Gamer Pro 7.1",
                sku: "HS-PRO-Bling",
                custo: 150.00,
                listings: [
                    { marketplace: "mercado_livre", preco: 299.90, frete: 25.00 },
                    { marketplace: "shopee", preco: 239.90, frete: 12.00 },
                    { marketplace: "shein", preco: 219.90, frete: 10.00 },
                    { marketplace: "amazon", preco: 220.00, frete: 18.00 }
                ]
            },
            {
                nome: "Mini Projetor Portátil LED Smart",
                sku: "PRJ-MINI-Bling",
                custo: 210.00,
                listings: [
                    { marketplace: "mercado_livre", preco: 320.00, frete: 30.00 },
                    { marketplace: "shopee", preco: 280.00, frete: 15.00 },
                    { marketplace: "shein", preco: 290.00, frete: 12.00 },
                    { marketplace: "amazon", preco: 310.00, frete: 20.00 }
                ]
            }
        ];

        let addedCount = 0;

        mockBlingSkus.forEach(item => {
            item.listings.forEach(lst => {
                const key = `${item.sku}_${lst.marketplace}`;
                if (!existingSkusAndMkts.has(key)) {
                    const calc = this.calculateMargin(item.custo, lst.frete, lst.preco, lst.marketplace);
                    
                    const newProd = {
                        id: `p-${Math.random().toString(36).substr(2, 9)}`,
                        user_id: currentUserId,
                        nome: item.nome,
                        sku: item.sku,
                        marketplace: lst.marketplace,
                        custo: item.custo,
                        frete: lst.frete,
                        taxas: parseFloat(calc.fees),
                        margem: parseFloat(calc.margin),
                        preco_atual: lst.preco,
                        estoque: Math.floor(Math.random() * 80) + 15,
                        fulfillment: lst.marketplace === 'mercado_livre' ? 'full' : (lst.marketplace === 'amazon' ? 'fba' : 'sem'),
                        created_at: new Date().toISOString(),
                        imported: true,
                        source: "bling"
                    };

                    products.push(newProd);
                    this.updateAlertsForProduct(newProd);
                    addedCount++;
                }
            });
        });

        db.set("products", products);

        if (addedCount > 0) {
            this.addLog(currentUserId, "Importação Bling", `Sincronizados ${addedCount} anúncios do ERP Bling vinculando margens nos respectivos canais.`);
        }

        return { success: true, count: addedCount };
    },

    saveMultiChannelProduct(payload) {
        const currentUserId = this.getCurrentUser()?.id;
        if (!currentUserId) return { success: false, message: "Sessão expirada." };

        const products = db.get("products");
        
        // Find existing listings for this SKU
        const otherSkusProducts = products.filter(p => !(p.user_id === currentUserId && (p.sku === payload.oldSku || p.sku === payload.sku)));
        const currentSkuProducts = products.filter(p => p.user_id === currentUserId && (p.sku === payload.oldSku || p.sku === payload.sku));

        // Sub limits check
        const subs = db.get("subscriptions");
        const sub = subs.find(s => s.user_id === currentUserId);
        const planLimit = PLANS[sub?.plano || 'pro'].maxProducts;

        const finalProductsToKeep = [...otherSkusProducts];

        payload.canais.forEach(chan => {
            if (chan.enabled) {
                const calc = this.calculateMargin(payload.custo, chan.frete, chan.preco, chan.marketplace);
                const existing = currentSkuProducts.find(p => p.marketplace === chan.marketplace);
                
                const prodRecord = {
                    id: existing ? existing.id : genId('p'),
                    user_id: currentUserId,
                    nome: payload.nome,
                    sku: payload.sku,
                    marketplace: chan.marketplace,
                    custo: parseFloat(payload.custo) || 0,
                    frete: parseFloat(chan.frete) || 0,
                    taxas: parseFloat(calc.fees),
                    margem: parseFloat(calc.margin),
                    preco_atual: parseFloat(chan.preco) || 0,
                    estoque: parseInt(chan.estoque) || 0,
                    fulfillment: chan.fulfillment || 'sem',
                    created_at: existing ? existing.created_at : new Date().toISOString(),
                    imported: existing ? existing.imported : false,
                    source: existing ? (existing.source || null) : null
                };

                finalProductsToKeep.push(prodRecord);
                this.updateAlertsForProduct(prodRecord);
            } else {
                const existing = currentSkuProducts.find(p => p.marketplace === chan.marketplace);
                if (existing) {
                    const alerts = db.get("alerts");
                    const filteredAlerts = alerts.filter(a => !(a.user_id === currentUserId && a.mensagem.includes(`(SKU: ${existing.sku})`)));
                    db.set("alerts", filteredAlerts);
                }
            }
        });

        const newUserProductsCount = finalProductsToKeep.filter(p => p.user_id === currentUserId).length;
        if (newUserProductsCount > planLimit) {
            return { 
                success: false, 
                message: `Limite de produtos atingido para o plano ${PLANS[sub?.plano || 'pro'].name.toUpperCase()} (${planLimit} produtos).` 
            };
        }

        db.set("products", finalProductsToKeep);

        this.addLog(
            currentUserId, 
            "Produto editado (Multicanal)", 
            `Configurações do SKU: ${payload.sku} atualizadas para múltiplos canais de venda.`
        );

        return { success: true };
    }
};
