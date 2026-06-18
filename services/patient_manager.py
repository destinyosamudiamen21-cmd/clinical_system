from models.patient import Patient
import json


class PatientManager:

    
    def add_patient(self, patient_data: dict):

        try:
            with open("storage/patient.json", 'r') as file:
                patients = json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            patients = []
        
        for patient in patients:
            if patient["patient_id"] == patient_data["patient_id"]:
                return {
                    "error": "Patient ID already exist"
                    }
            
        patients.append(patient_data)

        with open("storage/patient.json", "w") as file:
            json.dump(patients, file, indent=4)

        return {"status" : "successful"}
        

    def update_patient(self, patient_id: str, updated_data : dict):

        try:
            with open("storage/patient.json", "r") as f:
                patients = json.load(f)

        except FileNotFoundError:
            return {"error" : "Patient file not found"}
        
        for patient in patients:

            if patient["patient_id"] == patient_id:
                patient.update(updated_data)

        with open("storage/patient.json", "w") as f:
            json.dump(patients, f, indent=4)

        return {"status": "successful"}


    def remove_patient(self, patient_id):

        with open('storage/patient.json', 'r') as file:
            patients = json.load(file)

        # patient_id = input('Enter patient id: ')

        remaining_patients = [
            patient
            for patient in patients
            if patient["patient_id"] != patient_id
        ]
        
        with open('storage/patient.json', 'w') as f:
            json.dump(remaining_patients, f, indent=4)

            return {"status" : "Successfull"}

    

    def search_patient(self, patient_id):

        # patient_id = input('Enter patient Id: ')

        try:
            with open('storage/patient.json', 'r') as f:
                patients = json.load(f)

        except FileNotFoundError:
            return {"error" : "Patient not found"}
            # print('No available files yet')
            # return

        for patient in patients:
            if patient["patient_id"] == patient_id:
                return patient

                # display_patient(patient)
        return {"status" : "successful"}
                
        

    def patient_list(self):

        try:

            with open('storage/patient.json', 'r') as f:
                patients = json.load(f)

        except FileNotFoundError:
            # print('No files avaliable')
            return {"error" : "Patients list not found"}

        for patient in patients:

            # display_patient(patient)
            return patients

    


    

           