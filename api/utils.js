const requireUser = async(req, res, next) => {
    if (!req.user) {
        next({
            name: 'MissingUserError',
            message: 'officially missing u...ser'
        });
    }
    next();
}

module.exports = {
    requireUser
}