# Modelo de Importação de Lançamentos via CSV

## Formato do Arquivo

O arquivo CSV deve conter as seguintes colunas (separadas por vírgula ou ponto e vírgula):

### Colunas Obrigatórias:
1. **data** - Data da transação (formato: DD/MM/YYYY ou YYYY-MM-DD)
2. **tipo** - Tipo da transação: `Despesa` ou `Receita`
3. **metodoPagamento** - Método de pagamento: `Crédito`, `Débito`, `PIX` ou `Dinheiro`
4. **pessoa** - Pessoa responsável: `Kaio`, `Gabriela` ou `Ambos`
5. **categoria** - Categoria da transação (ex: Alimentação, Transporte, etc.)
6. **descricao** - Descrição da transação
7. **valor** - Valor da transação (use ponto ou vírgula como separador decimal)

### Colunas Opcionais:
8. **competencia** - Competência no formato MM/YYYY (se não informado, será calculado a partir da data)
9. **cartaoCredito** - Nome do cartão de crédito (obrigatório apenas se método de pagamento for Crédito)
10. **parcelas** - Número de parcelas (padrão: 1)

## Exemplo de CSV

```csv
data,tipo,metodoPagamento,pessoa,categoria,descricao,valor,competencia,cartaoCredito,parcelas
19/11/2025,Despesa,Crédito,Kaio,Alimentação,Supermercado,150.50,11/2025,Nubank,1
20/11/2025,Receita,PIX,Gabriela,Salário,Salário mensal,5000.00,11/2025,,1
21/11/2025,Despesa,Débito,Ambos,Transporte,Uber,25.00,11/2025,,1
22/11/2025,Despesa,Crédito,Kaio,Compras,Notebook,2500.00,11/2025,Inter,12
```

## Observações Importantes

1. **Cabeçalho**: A primeira linha pode conter o cabeçalho com os nomes das colunas. Se presente, será ignorado automaticamente.

2. **Separadores**: O arquivo pode usar vírgula (`,`) ou ponto e vírgula (`;`) como separador.

3. **Valores Decimais**: Use ponto (`.`) ou vírgula (`,`) como separador decimal no campo valor.

4. **Cartão de Crédito**: O nome do cartão deve corresponder exatamente ao nome cadastrado no sistema. Se o método de pagamento for Crédito e o cartão não for informado ou não for encontrado, a importação falhará para aquela linha.

5. **Parcelas**: Se não informado, será considerado 1 parcela (à vista). Para compras parceladas, informe o número total de parcelas.

6. **Competência**: Se não informado, será calculado automaticamente a partir da data da transação no formato MM/YYYY.

## Endpoint de Importação

**POST** `/api/transactions/import`

**Content-Type**: `multipart/form-data`

**Parâmetro**: `file` (arquivo CSV)

**Resposta**:
```json
{
  "totalProcessed": 10,
  "successCount": 8,
  "errorCount": 2,
  "errors": [
    "Linha 3: Cartão de crédito não encontrado: Cartão Inválido",
    "Linha 5: Tipo inválido: Despesas. Use 'Despesa' ou 'Receita'"
  ]
}
```


