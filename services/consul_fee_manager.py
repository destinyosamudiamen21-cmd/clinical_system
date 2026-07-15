from sqlmodel import Session,select
from models.consultation_fee import ConsultationFee

class FeeManager:
    def get_fee(self, session: Session):
        #return the current fee row
        return session.exec(select(ConsultationFee).order_by(ConsultationFee.id.desc())).first()
    
    def set_fee(self, amount:float, session:Session):
        fee = ConsultationFee(amount=amount)
        session.add(fee)
        session.commit()
        session.refresh(fee)
        return fee