import secrets
from sqlmodel import Session,select
from models.pin import Payment

class PaymentManager():
    def confirm_payment(self, patient_id: int, confirmed_by, session: Session):
        #this generates a 6 character random pin
        pin = "".join(secrets.choice("0123456789") for _ in range(4)) 
        payment = Payment(
            pin=pin,
            patient_id=patient_id,
            confirmed_by=confirmed_by
        )
        session.add(payment)
        session.commit()
        session.refresh(payment)
        return payment
    
    def get_valid_pin(self, pin: str,patient_id: int, session:Session ):
        statement = select(Payment).where(
            Payment.pin ==pin,
            Payment.patient_id == patient_id,
            Payment.is_used == False
        )
        return session.exec(statement).first()