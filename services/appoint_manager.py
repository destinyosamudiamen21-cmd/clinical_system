from models.appointment import Appointment
import json


class AppointmentManager:
    
    def create_appointment(self, appointment_data: dict):

        try:
            with open("storage/appoint.json", "r") as file:
                appointments = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            appointments = []

        appointments.append(appointment_data)

        for appointment in appointments:
            if appointment["appointment_id"] == appointment_data["appointment_id"]:
                return {"error" : 
                        "Appointment Id already exist"}
            
        with open("storage/appoint.json", "w") as file:
            json.dump(appointments, file, indent=4)

        return {"status" : "successful"}


    def search_appointment(self, appointment_id: str):
        try:
            with open("storage/appoint.json", "r") as file:
                appointments = json.load(file)
        except FileNotFoundError:
            {"error" : "Patient appointment file not found"}

        for appointment in appointments:
            if appointment["appointment_id"] == appointment_id:

                return appointment
        

    def update_appointment(self, appointment_id: str, appointment_data: dict):
        try:
            with open("storage/appoint.json", "r") as file:
                appointments = json.load(file)
        except FileNotFoundError:
            {"error" : "No Patient appointment found"}

        for appointment in appointments:
            if appointment["appointment_id"] == appointment_id:
                appointment.update(appointment_data)

        with open("storage/appoint.json", "w") as file:
            json.dump(appointments, file, indent=4)

        return {"status" : "successful"}

    def delete_appointment(self, appointment_id: str):

        try:
    
            with open("storage/appoint.json", "r") as file:
                appointments = json.load(file)

        except FileNotFoundError:
            {"error" : "Patient appointment not found"}
    

        remaining_appointment = [
            appointment
            for appointment in appointments
            if appointment["appointment_id"] != appointment_id
        ]

        with open("storage/appoint.json", "w") as file:
            json.dump(remaining_appointment, file, indent=4)

        return {"status" : "successful"}

    def list_appoinment(self):
        try:
            with open("storage/appoint.json", "r") as file:
                appointments = json.load(file)
        except FileNotFoundError:
            {"error" : "Patient list not found"}

        for appointment in appointments:

            return appointments
            
        