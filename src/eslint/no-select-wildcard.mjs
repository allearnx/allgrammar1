/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Supabase .select("*") 사용을 경고하여 egress 낭비를 방지합니다.',
    },
    messages: {
      noSelectWildcard:
        '.select("*") 대신 필요한 컬럼만 명시하세요. 예: .select("id, title, ...") 또는 SHEET_LITE_COLUMNS 같은 상수를 사용하세요.',
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;

        // .select('*') 패턴 매칭
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'select' &&
          node.arguments.length >= 1
        ) {
          const arg = node.arguments[0];

          // .select('*') or .select("*") or .select(`*`)
          if (
            (arg.type === 'Literal' && arg.value === '*') ||
            (arg.type === 'TemplateLiteral' &&
              arg.quasis.length === 1 &&
              arg.quasis[0].value.raw === '*')
          ) {
            context.report({ node, messageId: 'noSelectWildcard' });
          }
        }
      },
    };
  },
};
