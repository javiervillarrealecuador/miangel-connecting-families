import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Patient {
  id: string; // equipo_pai.id
  familia_id: string;
  persona_autismo_id: string;
  rol: string;
  name: string;
  birth_date?: string;
}

interface PatientContextType {
  patients: Patient[];
  currentPatient: Patient | null;
  currentPatientId: string | null;
  currentFamilyId: string | null;
  switchPatient: (patientId: string) => void;
  isLoading: boolean;
  refreshPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      console.log("Current logged in user ID:", user.id, "Email:", user.email);

      const { data: teamData, error } = await supabase
        .from('equipo_pai')
        .select(`
          id, 
          familia_id, 
          persona_autismo_id, 
          rol, 
          personas_autismo(full_name, birth_date)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error loading patients:", error);
        setIsLoading(false);
        return;
      }

      if (teamData && teamData.length > 0) {
        console.log("Team Data fetched from Supabase:", teamData);
        const loadedPatients: Patient[] = teamData.map(t => ({
          id: t.id,
          familia_id: t.familia_id,
          persona_autismo_id: t.persona_autismo_id,
          rol: t.rol,
          // @ts-ignore
          name: t.personas_autismo?.full_name || 'Hijo/a',
          // @ts-ignore
          birth_date: t.personas_autismo?.birth_date
        }));

        // Eliminar duplicados si el mismo usuario fue agregado múltiples veces al mismo paciente (por error)
        const uniquePatients = Array.from(new Map(loadedPatients.map(item => [item.persona_autismo_id, item])).values());

        console.log("Loaded Patients parsed and unique:", uniquePatients);
        setPatients(uniquePatients);

        // Si ya había un paciente seleccionado, intentamos mantenerlo si sigue en la lista
        const savedPatientId = localStorage.getItem('miangel_current_patient_id');
        const found = savedPatientId ? uniquePatients.find(p => p.persona_autismo_id === savedPatientId) : null;

        if (found) {
          setCurrentPatient(found);
        } else {
          // Por defecto seleccionamos el primero
          setCurrentPatient(uniquePatients[0]);
          localStorage.setItem('miangel_current_patient_id', uniquePatients[0].persona_autismo_id);
        }
      } else {
        setPatients([]);
        setCurrentPatient(null);
        localStorage.removeItem('miangel_current_patient_id');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const switchPatient = (patientId: string) => {
    const selected = patients.find(p => p.persona_autismo_id === patientId);
    if (selected) {
      setCurrentPatient(selected);
      localStorage.setItem('miangel_current_patient_id', selected.persona_autismo_id);
    }
  };

  return (
    <PatientContext.Provider value={{
      patients,
      currentPatient,
      currentPatientId: currentPatient?.persona_autismo_id || null,
      currentFamilyId: currentPatient?.familia_id || null,
      switchPatient,
      isLoading,
      refreshPatients: loadPatients
    }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
}
