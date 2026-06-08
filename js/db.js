/* --- Database Initialization and LocalStorage Persistence --- */

const DB_KEY_PREFIX = "precificapro_";

// Pre-configured marketplace attributes for initial setup
export const MARKETPLACES = {
    mercado_livre: { name: "Mercado Livre", id: "mercado_livre", flatFee: 6.0, percentFee: 12.0, freeShippingThreshold: 79.0 },
    shopee: { name: "Shopee", id: "shopee", flatFee: 4.0, percentFee: 20.0, freeShippingThreshold: 39.0 },
    amazon: { name: "Amazon", id: "amazon", flatFee: 0.0, percentFee: 15.0, freeShippingThreshold: 120.0 },
    magalu: { name: "Magalu", id: "magalu", flatFee: 5.0, percentFee: 16.0, freeShippingThreshold: 99.0 },
    shein: { name: "Shein", id: "shein", flatFee: 3.0, percentFee: 14.0, freeShippingThreshold: 49.0 },
    tiktok_shop: { name: "TikTok Shop", id: "tiktok_shop", flatFee: 2.0, percentFee: 15.0, freeShippingThreshold: 50.0 },
    olist: { name: "Olist", id: "olist", flatFee: 5.0, percentFee: 21.0, freeShippingThreshold: 120.0 },
    webcontinental: { name: "Webcontinental", id: "webcontinental", flatFee: 6.0, percentFee: 16.0, freeShippingThreshold: 150.0 }
};

// Available premium plans
export const PLANS = {
    pro: { id: "pro", name: "Plano Único Pro", price: 19.90, maxProducts: 5000 }
};

// Initial Seed Data
const DEFAULT_USERS = [
    { id: "u-1", nome: "Admin Geral", email: "admin@precificacao.com", senha: "admin", tipo: "admin", status: "ativo", created_at: "2026-01-15T10:00:00Z" },
    { id: "u-2", nome: "João Vendedor", email: "joao@vendedor.com", senha: "cliente", tipo: "cliente", status: "ativo", created_at: "2026-02-10T14:30:00Z" },
    { id: "u-3", nome: "Maria E-commerce", email: "maria@ecom.com", senha: "cliente", tipo: "cliente", status: "ativo", created_at: "2026-03-01T09:15:00Z" },
    { id: "u-4", nome: "Pedro Imports", email: "pedro@import.com", senha: "cliente", tipo: "cliente", status: "bloqueado", created_at: "2026-03-20T11:45:00Z" },
    { id: "u-5", nome: "Ana Modas", email: "ana@moda.com", senha: "cliente", tipo: "cliente", status: "ativo", created_at: "2026-05-12T16:20:00Z" }
];

const DEFAULT_SUBSCRIPTIONS = [
    { id: "s-1", user_id: "u-2", plano: "pro", status: "ativo", vencimento: "2026-06-15" },
    { id: "s-2", user_id: "u-3", plano: "pro", status: "ativo", vencimento: "2026-06-20" },
    { id: "s-3", user_id: "u-4", plano: "pro", status: "inadimplente", vencimento: "2026-05-10" },
    { id: "s-4", user_id: "u-5", plano: "pro", status: "ativo", vencimento: "2026-06-12" }
];

const DEFAULT_PRODUCTS = [
    // João Vendedor products (u-2)
    { id: "p-1", user_id: "u-2", nome: "Teclado Mecânico RGB Gamer", sku: "KB-RGB-01", marketplace: "mercado_livre", custo: 120.00, frete: 25.00, taxas: 30.00, margem: 15.00, preco_atual: 220.00, estoque: 85, fulfillment: "full", created_at: "2026-02-15T11:00:00Z" },
    { id: "p-2", user_id: "u-2", nome: "Mouse Wireless Recarregável", sku: "MS-WRL-02", marketplace: "shopee", custo: 35.00, frete: 12.00, taxas: 16.00, margem: 25.00, preco_atual: 85.00, estoque: 150, fulfillment: "sem", created_at: "2026-02-16T15:22:00Z" },
    { id: "p-3", user_id: "u-2", nome: "Fone Bluetooth Premium ANC", sku: "HP-ANC-99", marketplace: "amazon", custo: 180.00, frete: 18.00, taxas: 45.00, margem: -5.00, preco_atual: 230.00, estoque: 42, fulfillment: "fba", created_at: "2026-03-02T10:10:00Z" },
    { id: "p-4", user_id: "u-2", nome: "Carregador Rápido USB-C 20W", sku: "CH-USBC-20", marketplace: "magalu", custo: 15.00, frete: 10.00, taxas: 13.00, margem: 30.00, preco_atual: 55.00, estoque: 280, fulfillment: "sem", created_at: "2026-03-10T16:45:00Z" },
    { id: "p-5", user_id: "u-2", nome: "Cabo HDMI 2.1 Ultra HD 2m", sku: "CB-HDMI-21", marketplace: "shein", custo: 18.00, frete: 8.00, taxas: 6.00, margem: 20.00, preco_atual: 40.00, estoque: 190, fulfillment: "sem", created_at: "2026-04-01T09:30:00Z" },
    { id: "p-6", user_id: "u-2", nome: "Suporte de Mesa Articulado Monitor", sku: "SP-MON-01", marketplace: "tiktok_shop", custo: 80.00, frete: 22.00, taxas: 32.00, margem: -8.00, preco_atual: 110.00, estoque: 75, fulfillment: "sem", created_at: "2026-04-18T14:12:00Z" },
    { id: "p-7", user_id: "u-2", nome: "Smartwatch Sport Track GPS", sku: "SW-GPS-05", marketplace: "olist", custo: 290.00, frete: 35.00, taxas: 92.00, margem: 12.00, preco_atual: 480.00, estoque: 35, fulfillment: "sem", created_at: "2026-05-01T11:00:00Z" },
    { id: "p-8", user_id: "u-2", nome: "Ring Light de Mesa USB", sku: "RL-USB-06", marketplace: "webcontinental", custo: 25.00, frete: 15.00, taxas: 20.00, margem: 5.00, preco_atual: 65.00, estoque: 110, fulfillment: "sem", created_at: "2026-05-10T13:40:00Z" },

    // Maria E-commerce products (u-3)
    { id: "p-9", user_id: "u-3", nome: "Kit Esponja de Maquiagem Faciais", sku: "KT-ESP-01", marketplace: "shopee", custo: 8.00, frete: 6.00, taxas: 5.00, margem: 40.00, preco_atual: 25.00, created_at: "2026-03-05T09:30:00Z" },
    { id: "p-10", user_id: "u-3", nome: "Organizador de Acrílico Giratório", sku: "ORG-ACR-02", marketplace: "mercado_livre", custo: 45.00, frete: 18.00, taxas: 16.00, margem: 18.00, preco_atual: 95.00, created_at: "2026-03-12T14:00:00Z" }
];

const DEFAULT_ALERTS = [
    { id: "a-1", user_id: "u-2", tipo: "prejuizo", mensagem: "O produto 'Fone Bluetooth Premium ANC' (SKU: HP-ANC-99) está com margem negativa (-5%) na Amazon. Risco de prejuízo por venda!", status: "nao_lido", created_at: "2026-05-28T10:00:00Z" },
    { id: "a-2", user_id: "u-2", tipo: "prejuizo", mensagem: "O produto 'Suporte de Mesa Articulado Monitor' (SKU: SP-MON-01) está gerando margem negativa (-8%) no TikTok Shop.", status: "nao_lido", created_at: "2026-05-29T08:15:00Z" },
    { id: "a-3", user_id: "u-2", tipo: "desatualizado", mensagem: "As taxas do marketplace Shopee foram reajustadas. Verifique a precificação de seus produtos.", status: "lido", created_at: "2026-05-25T09:00:00Z" },
    
    { id: "a-4", user_id: "u-4", tipo: "taxa", mensagem: "Assinatura pendente. Atualize seus dados de faturamento para evitar bloqueio definitivo.", status: "nao_lido", created_at: "2026-05-11T12:00:00Z" }
];

const DEFAULT_LOGS = [
    { id: "l-1", user_id: "u-1", acao: "Login efetuado no sistema", detalhes: "Admin logado via IP 192.168.1.1", created_at: "2026-05-29T10:12:00Z" },
    { id: "l-2", user_id: "u-2", acao: "Novo produto cadastrado", detalhes: "Produto 'Ring Light de Mesa USB' adicionado para Webcontinental", created_at: "2026-05-28T14:40:00Z" },
    { id: "l-3", user_id: "u-1", acao: "Bloqueio de usuário", detalhes: "Conta do usuário 'Pedro Imports' bloqueada por atraso na assinatura", created_at: "2026-05-20T11:46:00Z" },
    { id: "l-4", user_id: "u-3", acao: "Alteração de preço", detalhes: "Teclado Mecânico precificado com nova margem de 18%", created_at: "2026-05-27T16:30:00Z" }
];

const DEFAULT_ORDERS = [
    { id: "o-1", user_id: "u-2", pedido_id: "ML-2981", data: "2026-05-28T10:30:00Z", produto_id: "p-1", sku: "KB-RGB-01", nome_produto: "Teclado Mecânico RGB Gamer", marketplace: "mercado_livre", preco_venda: 220.00, custo: 120.00, frete: 25.00, comissao: 26.40, taxa_fixa: 6.00, lucro: 42.60, margem: 19.4, status: "entregue" },
    { id: "o-2", user_id: "u-2", pedido_id: "SP-3982", data: "2026-05-28T14:15:00Z", produto_id: "p-2", sku: "MS-WRL-02", nome_produto: "Mouse Wireless Recarregável", marketplace: "shopee", preco_venda: 85.00, custo: 35.00, frete: 12.00, comissao: 17.00, taxa_fixa: 4.00, lucro: 17.00, margem: 20.0, status: "entregue" },
    { id: "o-3", user_id: "u-2", pedido_id: "AMZ-1928", data: "2026-05-27T09:45:00Z", produto_id: "p-3", sku: "HP-ANC-99", nome_produto: "Fone Bluetooth Premium ANC", marketplace: "amazon", preco_venda: 230.00, custo: 180.00, frete: 18.00, comissao: 34.50, taxa_fixa: 0.00, lucro: -2.50, margem: -1.1, status: "entregue" },
    { id: "o-4", user_id: "u-2", pedido_id: "MGL-8492", data: "2026-05-26T16:20:00Z", produto_id: "p-4", sku: "CH-USBC-20", nome_produto: "Carregador Rápido USB-C 20W", marketplace: "magalu", preco_venda: 55.00, custo: 15.00, frete: 10.00, comissao: 8.80, taxa_fixa: 5.00, lucro: 16.20, margem: 29.5, status: "entregue" },
    { id: "o-5", user_id: "u-2", pedido_id: "SHN-9284", data: "2026-05-25T11:10:00Z", produto_id: "p-5", sku: "CB-HDMI-21", nome_produto: "Cabo HDMI 2.1 Ultra HD 2m", marketplace: "shein", preco_venda: 40.00, custo: 18.00, frete: 8.00, comissao: 5.60, taxa_fixa: 3.00, lucro: 5.40, margem: 13.5, status: "enviado" },
    { id: "o-6", user_id: "u-2", pedido_id: "TT-1029", data: "2026-05-24T15:00:00Z", produto_id: "p-6", sku: "SP-MON-01", nome_produto: "Suporte de Mesa Articulado Monitor", marketplace: "tiktok_shop", preco_venda: 110.00, custo: 80.00, frete: 22.00, comissao: 16.50, taxa_fixa: 2.00, lucro: -10.50, margem: -9.5, status: "entregue" },
    { id: "o-7", user_id: "u-2", pedido_id: "OL-4829", data: "2026-05-23T10:00:00Z", produto_id: "p-7", sku: "SW-GPS-05", nome_produto: "Smartwatch Sport Track GPS", marketplace: "olist", preco_venda: 480.00, custo: 290.00, frete: 35.00, comissao: 100.80, taxa_fixa: 5.00, lucro: 49.20, margem: 10.3, status: "entregue" },
    { id: "o-8", user_id: "u-2", pedido_id: "ML-3091", data: "2026-05-22T13:40:00Z", produto_id: "p-1", sku: "KB-RGB-01", nome_produto: "Teclado Mecânico RGB Gamer", marketplace: "mercado_livre", preco_venda: 220.00, custo: 120.00, frete: 25.00, comissao: 26.40, taxa_fixa: 6.00, lucro: 42.60, margem: 19.4, status: "entregue" },
    { id: "o-9", user_id: "u-2", pedido_id: "SP-4091", data: "2026-05-21T08:15:00Z", produto_id: "p-2", sku: "MS-WRL-02", nome_produto: "Mouse Wireless Recarregável", marketplace: "shopee", preco_venda: 85.00, custo: 35.00, frete: 12.00, comissao: 17.00, taxa_fixa: 4.00, lucro: 17.00, margem: 20.0, status: "cancelado" },
    
    // Maria E-commerce orders (u-3)
    { id: "o-10", user_id: "u-3", pedido_id: "SP-9921", data: "2026-05-28T16:00:00Z", produto_id: "p-9", sku: "KT-ESP-01", nome_produto: "Kit Esponja de Maquiagem Faciais", marketplace: "shopee", preco_venda: 25.00, custo: 8.00, frete: 6.00, comissao: 5.00, taxa_fixa: 4.00, lucro: 2.00, margem: 8.0, status: "entregue" }
];

const DEFAULT_ADS_CAMPAIGNS = [
    { id: "c-1", user_id: "u-2", nome: "ML Product Ads - Teclado", marketplace: "mercado_livre", investimento: 250.00, faturamento_atribuido: 1250.00, cliques: 420, status: "ativo" },
    { id: "c-2", user_id: "u-2", nome: "Shopee Ads Smart - Mouse", marketplace: "shopee", investimento: 180.00, faturamento_atribuido: 720.00, cliques: 310, status: "ativo" },
    { id: "c-3", user_id: "u-2", nome: "Amazon Sponsored - Fone ANC", marketplace: "amazon", investimento: 320.00, faturamento_atribuido: 980.00, cliques: 510, status: "ativo" },
    { id: "c-4", user_id: "u-2", nome: "TikTok Shop Promo - Suporte", marketplace: "tiktok_shop", investimento: 150.00, faturamento_atribuido: 450.00, cliques: 280, status: "pausado" },
    
    // Maria E-commerce ads (u-3)
    { id: "c-5", user_id: "u-3", nome: "Shopee Ads - Esponjas", marketplace: "shopee", investimento: 30.00, faturamento_atribuido: 150.00, cliques: 95, status: "ativo" }
];

// Database Utilities
export const db = {
    // Read a table
    get(table) {
        const data = localStorage.getItem(DB_KEY_PREFIX + table);
        return data ? JSON.parse(data) : [];
    },

    // Write a table
    set(table, data) {
        localStorage.setItem(DB_KEY_PREFIX + table, JSON.stringify(data));
    },

    // Initialize all tables with seed data if they don't exist
    init() {
        if (!localStorage.getItem(DB_KEY_PREFIX + "users")) {
            this.set("users", DEFAULT_USERS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "subscriptions")) {
            this.set("subscriptions", DEFAULT_SUBSCRIPTIONS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "products")) {
            this.set("products", DEFAULT_PRODUCTS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "alerts")) {
            this.set("alerts", DEFAULT_ALERTS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "logs")) {
            this.set("logs", DEFAULT_LOGS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "orders")) {
            this.set("orders", DEFAULT_ORDERS);
        }
        if (!localStorage.getItem(DB_KEY_PREFIX + "ads_campaigns")) {
            this.set("ads_campaigns", DEFAULT_ADS_CAMPAIGNS);
        }
        
        // Seed Custom Marketplace fees overrides if not present
        if (!localStorage.getItem(DB_KEY_PREFIX + "marketplace_settings")) {
            this.set("marketplace_settings", MARKETPLACES);
        }

        // Migration Upgrade: if database is on old plans, force reset to seed new R$ 19.90 Plano Pro values
        const subs = this.get("subscriptions");
        if (subs.length > 0 && subs.some(s => s.plano === "ouro" || s.plano === "prata" || s.plano === "bronze")) {
            this.reset();
        }
    },

    // Clean databases completely
    reset() {
        localStorage.removeItem(DB_KEY_PREFIX + "users");
        localStorage.removeItem(DB_KEY_PREFIX + "subscriptions");
        localStorage.removeItem(DB_KEY_PREFIX + "products");
        localStorage.removeItem(DB_KEY_PREFIX + "alerts");
        localStorage.removeItem(DB_KEY_PREFIX + "logs");
        localStorage.removeItem(DB_KEY_PREFIX + "orders");
        localStorage.removeItem(DB_KEY_PREFIX + "ads_campaigns");
        localStorage.removeItem(DB_KEY_PREFIX + "marketplace_settings");
        this.init();
    }
};

// Run automatically on import
db.init();
