-- Criar a tabela gasto_fixo
-- Serve apenas para guardar os gastos fixos de cada usuario (o que aparece na
-- tela de Gastos Fixos). Os gastos so entram em movimentacao quando um
-- pagamento e registrado: cada pagamento vira uma movimentacao normal
-- (titulo = descricao do gasto fixo, categoria = 'Gastos Fixos').
CREATE TABLE IF NOT EXISTS gasto_fixo (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    valor_estimado NUMERIC(10, 2) NOT NULL,
    dia_vencimento INT NOT NULL,
    status_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_gasto_fixo_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id) ON DELETE CASCADE,
    CONSTRAINT ck_gasto_fixo_valor CHECK (valor_estimado > 0),
    CONSTRAINT ck_gasto_fixo_dia CHECK (dia_vencimento BETWEEN 1 AND 31)
);

-- O historico de pagamentos e localizado pelo titulo da movimentacao, entao a
-- descricao nao pode se repetir para o mesmo usuario (sem diferenciar maiusculas)
CREATE UNIQUE INDEX IF NOT EXISTS ux_gasto_fixo_usuario_descricao
ON gasto_fixo (id_usuario, LOWER(descricao));

-- Cadastrar um gasto fixo
INSERT INTO gasto_fixo (id_usuario, descricao, valor_estimado, dia_vencimento)
VALUES (1, 'Conta de luz', 180.00, 10);

-- Confirmar o cadastro
SELECT * FROM gasto_fixo WHERE id_usuario = 1;

-- Desativar (nao exclui: so troca o campo booleano)
UPDATE gasto_fixo SET status_ativo = FALSE WHERE id = 1;

-- Registros de pagamento do gasto fixo 'Conta de luz' (JOIN com movimentacao)
SELECT m.data_transacao AS Data_pagamento,
       m.valor AS Valor_pago,
       cf.nome_conta AS conta_financeira
FROM movimentacao m
INNER JOIN conta_financeira cf ON m.id_conta_financeira = cf.id
INNER JOIN categoria cat ON m.id_categoria = cat.id
WHERE m.titulo = 'Conta de luz'
  AND cat.nome = 'Gastos Fixos';