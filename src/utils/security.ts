



export const containsSQLInjection = (value: string): boolean => {
    //  주요 공격 키워드 정규식
    const sqlRegex = /(SELECT|UPDATE|INSERT|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|OR\s+1=1|--|;)/gi;
    return sqlRegex.test(value);
};