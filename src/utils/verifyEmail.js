import dns from 'dns/promises'

const emailValidation=async (email)=>{
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const domain = email.split('@')[1]
    const record = await dns.resolveMx(domain)

    return emailRegex.test(email) && record.length
}

export { emailValidation }