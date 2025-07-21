import type { ExprNode } from '@/types';

export function isExprNode(node: unknown): node is ExprNode {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) {
    return false;
  }

  const nodeObj = node as Record<string, unknown>;

  if (typeof nodeObj.op !== 'string') {
    return false;
  }

  switch (nodeObj.op) {
    case 'and':
    case 'or':
      return (
        Array.isArray(nodeObj.children) &&
        nodeObj.children.every((child: unknown) => isExprNode(child))
      );

    case 'not':
      return isExprNode(nodeObj.child);

    case '==':
    case '!=':
    case '>':
    case '<':
    case '>=':
    case '<=':
      return (
        typeof nodeObj.property === 'string' &&
        (typeof nodeObj.value === 'string' || typeof nodeObj.value === 'number')
      );

    case 'some':
    case 'all':
      return isExprNode(nodeObj.predicate);

    case 'sum': {
      const hasRequired =
        typeof nodeObj.property === 'string' &&
        typeof nodeObj.operator === 'string' &&
        ['==', '!=', '>', '<', '>=', '<='].includes(nodeObj.operator) &&
        typeof nodeObj.value === 'number';

      const isPredicateValid =
        !('predicate' in nodeObj) || isExprNode(nodeObj.predicate);

      return hasRequired && isPredicateValid;
    }

    case 'count':
      return (
        isExprNode(nodeObj.predicate) &&
        typeof nodeObj.operator === 'string' &&
        ['==', '!=', '>', '<', '>=', '<='].includes(nodeObj.operator) &&
        typeof nodeObj.value === 'number'
      );

    case 'custom': {
      const hasRequired = nodeObj.id === 'no_gaps_by_day';
      const areParamsValid =
        !('params' in nodeObj) ||
        (typeof nodeObj.params === 'object' &&
          nodeObj.params !== null &&
          !Array.isArray(nodeObj.params));

      return hasRequired && areParamsValid;
    }

    default:
      return false;
  }
}
