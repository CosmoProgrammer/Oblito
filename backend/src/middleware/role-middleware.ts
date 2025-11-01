export const checkRole = (req: any, res: any, next: any, requiredRole: string) => {
    if(!req.user){
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { role } = req.user;
    if(requiredRole !== role){
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
}