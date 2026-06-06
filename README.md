# Consulta CNPJ Investigativa
Aplicação React + Tailwind para consulta de CNPJ pela API pública.

## Rodar no computador

```bash
npm install
npm run dev
```

## Publicar no GitHub Pages

Este projeto já contém o workflow em `.github/workflows/deploy.yml`.

Depois de enviar os arquivos para um repositório chamado `consulta-cnpj`, vá em:

Settings > Pages > Build and deployment > Source > GitHub Actions

A cada novo envio para a branch `main`, o GitHub publicará o site automaticamente.

Link esperado:

```txt
https://SEU-USUARIO.github.io/consulta-cnpj/
```

## Observação

Não coloque informações sensíveis dentro deste repositório. O código apenas consulta a API no navegador.
