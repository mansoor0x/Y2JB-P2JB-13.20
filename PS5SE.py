import socket
import os
import json
import time
from datetime import datetime
from tkinter import *
from tkinter import filedialog, messagebox, ttk, scrolledtext

class PS5ScriptSender:
    def __init__(self, root):
        self.root = root
        self.root.title("PS5 Script Sender - mansoor0x")
        self.root.geometry("750x650")
        self.root.configure(bg="#0a0a1a")
        self.root.resizable(False, False)
        
        self.selected_files = []
        self.history = []
        self.server_ip = StringVar(value="192.168.1.100")
        self.port = IntVar(value=9021)
        
        self.setup_ui()
        
    def setup_ui(self):
        main_frame = Frame(self.root, bg="#0a0a1a")
        main_frame.pack(fill=BOTH, expand=True, padx=15, pady=15)
        
        title_frame = Frame(main_frame, bg="#0a0a1a")
        title_frame.pack(fill=X, pady=(0, 15))
        
        title = Label(title_frame, text="PS5 SCRIPT SENDER", 
                     font=("Arial", 22, "bold"), fg="#00d4ff", bg="#0a0a1a")
        title.pack()
        
        subtitle = Label(title_frame, text="@mansoor0x | GitHub/Twitter", 
                        font=("Arial", 10), fg="#666666", bg="#0a0a1a")
        subtitle.pack()
        
        settings_frame = LabelFrame(main_frame, text="PS5 Connection", 
                                    fg="#00d4ff", bg="#0a0a1a", font=("Arial", 11, "bold"),
                                    relief=GROOVE, bd=2)
        settings_frame.pack(fill=X, pady=(0, 15))
        
        ip_frame = Frame(settings_frame, bg="#0a0a1a")
        ip_frame.pack(fill=X, padx=10, pady=8)
        Label(ip_frame, text="PS5 IP:", fg="white", bg="#0a0a1a", width=10, anchor=W).pack(side=LEFT)
        Entry(ip_frame, textvariable=self.server_ip, width=20, bg="#1a1a2e", fg="white",
              insertbackground="white", font=("Arial", 10)).pack(side=LEFT, padx=5)
        Label(ip_frame, text="Port:", fg="white", bg="#0a0a1a", width=6, anchor=W).pack(side=LEFT, padx=(20,0))
        Entry(ip_frame, textvariable=self.port, width=8, bg="#1a1a2e", fg="white",
              insertbackground="white", font=("Arial", 10)).pack(side=LEFT, padx=5)
        
        test_btn = Button(ip_frame, text="Test Connection", command=self.test_connection,
                         bg="#ffa502", fg="white", cursor="hand2")
        test_btn.pack(side=RIGHT, padx=5)
        
        files_frame = LabelFrame(main_frame, text="Scripts", 
                                 fg="#00d4ff", bg="#0a0a1a", font=("Arial", 11, "bold"),
                                 relief=GROOVE, bd=2)
        files_frame.pack(fill=BOTH, expand=True, pady=(0, 15))
        
        btn_frame = Frame(files_frame, bg="#0a0a1a")
        btn_frame.pack(fill=X, padx=10, pady=8)
        
        Button(btn_frame, text="📁 Add Script", command=self.add_files,
               bg="#00d4ff", fg="black", font=("Arial", 10, "bold"),
               padx=15, pady=5, cursor="hand2").pack(side=LEFT, padx=5)
        
        Button(btn_frame, text="🗑 Remove", command=self.remove_file,
               bg="#ff4757", fg="white", font=("Arial", 10, "bold"),
               padx=15, pady=5, cursor="hand2").pack(side=LEFT, padx=5)
        
        Button(btn_frame, text="📋 Clear All", command=self.clear_files,
               bg="#ffa502", fg="white", font=("Arial", 10, "bold"),
               padx=15, pady=5, cursor="hand2").pack(side=LEFT, padx=5)
        
        Button(btn_frame, text="💾 Save List", command=self.save_list,
               bg="#2ed573", fg="white", font=("Arial", 10, "bold"),
               padx=15, pady=5, cursor="hand2").pack(side=LEFT, padx=5)
        
        Button(btn_frame, text="📂 Load List", command=self.load_list,
               bg="#0abde3", fg="white", font=("Arial", 10, "bold"),
               padx=15, pady=5, cursor="hand2").pack(side=LEFT, padx=5)
        
        list_frame = Frame(files_frame, bg="#0a0a1a")
        list_frame.pack(fill=BOTH, expand=True, padx=10, pady=5)
        
        scrollbar = Scrollbar(list_frame)
        scrollbar.pack(side=RIGHT, fill=Y)
        
        self.files_listbox = Listbox(list_frame, bg="#1a1a2e", fg="#00d4ff",
                                     selectbackground="#00d4ff", selectforeground="black",
                                     font=("Arial", 10), yscrollcommand=scrollbar.set,
                                     height=8)
        self.files_listbox.pack(fill=BOTH, expand=True)
        scrollbar.config(command=self.files_listbox.yview)
        
        self.progress_bar = ttk.Progressbar(main_frame, length=700, mode='determinate')
        self.progress_bar.pack(pady=(0, 10))
        
        self.status_label = Label(main_frame, text="Ready", fg="#00d4ff", bg="#0a0a1a",
                                  font=("Arial", 10))
        self.status_label.pack(pady=(0, 10))
        
        send_frame = Frame(main_frame, bg="#0a0a1a")
        send_frame.pack(fill=X, pady=(0, 10))
        
        self.send_btn = Button(send_frame, text="🚀 SEND TO PS5", command=self.send_files_thread,
                               bg="#00d4ff", fg="black", font=("Arial", 14, "bold"),
                               padx=40, pady=10, cursor="hand2")
        self.send_btn.pack()
        
        log_frame = LabelFrame(main_frame, text="Log History", 
                               fg="#00d4ff", bg="#0a0a1a", font=("Arial", 11, "bold"),
                               relief=GROOVE, bd=2)
        log_frame.pack(fill=BOTH, expand=True)
        
        self.log_text = scrolledtext.ScrolledText(log_frame, bg="#1a1a2e", fg="#00ff00",
                                                   font=("Consolas", 9), height=8)
        self.log_text.pack(fill=BOTH, expand=True, padx=5, pady=5)
        
        info_label = Label(main_frame, text="⚠️ Supported: .js, .bin, .elf, .so | Make sure PS5 payload server is running",
                          fg="#ffa502", bg="#0a0a1a", font=("Arial", 8))
        info_label.pack(pady=(5, 0))
        
        self.add_log("[*] PS5 Script Sender Ready")
        self.add_log(f"[*] Created by @mansoor0x")
        
    def add_log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_msg = f"[{timestamp}] {message}\n"
        self.log_text.insert(END, log_msg)
        self.log_text.see(END)
        self.history.append(log_msg)
        
    def test_connection(self):
        try:
            client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client.settimeout(3)
            client.connect((self.server_ip.get(), self.port.get()))
            client.close()
            self.add_log(f"[✓] Connection successful to {self.server_ip.get()}:{self.port.get()}")
            messagebox.showinfo("Success", "PS5 is reachable!")
        except Exception as e:
            self.add_log(f"[✗] Connection failed: {str(e)}")
            messagebox.showerror("Error", f"Cannot connect to PS5:\n{str(e)}")
            
    def add_files(self):
        files = filedialog.askopenfilenames(
            title="Select PS5 Scripts",
            filetypes=[("All scripts", "*.js *.bin *.elf *.so"), 
                      ("JavaScript", "*.js"),
                      ("Binary", "*.bin"),
                      ("ELF", "*.elf"),
                      ("Shared Object", "*.so")]
        )
        
        for file in files:
            if file not in self.selected_files:
                self.selected_files.append(file)
                self.files_listbox.insert(END, os.path.basename(file))
                self.add_log(f"[+] Added: {os.path.basename(file)}")
                
        self.status_label.config(text=f"Loaded {len(self.selected_files)} scripts")
        
    def remove_file(self):
        selection = self.files_listbox.curselection()
        if selection:
            index = selection[0]
            filename = os.path.basename(self.selected_files[index])
            self.files_listbox.delete(index)
            del self.selected_files[index]
            self.add_log(f"[-] Removed: {filename}")
            self.status_label.config(text=f"Loaded {len(self.selected_files)} scripts")
            
    def clear_files(self):
        self.selected_files.clear()
        self.files_listbox.delete(0, END)
        self.add_log("[*] Cleared all scripts")
        self.status_label.config(text="Cleared all scripts")
        
    def save_list(self):
        if not self.selected_files:
            messagebox.showwarning("Warning", "No scripts to save")
            return
        filename = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON files", "*.json")])
        if filename:
            with open(filename, 'w') as f:
                json.dump(self.selected_files, f)
            self.add_log(f"[✓] Saved script list: {os.path.basename(filename)}")
            
    def load_list(self):
        filename = filedialog.askopenfilename(filetypes=[("JSON files", "*.json")])
        if filename:
            with open(filename, 'r') as f:
                self.selected_files = json.load(f)
            self.files_listbox.delete(0, END)
            for file in self.selected_files:
                self.files_listbox.insert(END, os.path.basename(file))
            self.add_log(f"[✓] Loaded {len(self.selected_files)} scripts from {os.path.basename(filename)}")
            self.status_label.config(text=f"Loaded {len(self.selected_files)} scripts")
            
    def send_script(self, file_path):
        try:
            client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client.settimeout(10)
            client.connect((self.server_ip.get(), self.port.get()))
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                script_content = f.read()
            
            script_name = os.path.basename(file_path)
            script_size = len(script_content.encode())
            
            header = f"{script_name}\n{script_size}\n".encode()
            client.send(header)
            client.send(script_content.encode())
            
            response = client.recv(1024).decode()
            client.close()
            
            return response == "OK"
            
        except Exception as e:
            self.add_log(f"[✗] Error sending {os.path.basename(file_path)}: {str(e)}")
            return False
            
    def send_binary(self, file_path):
        try:
            client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client.settimeout(10)
            client.connect((self.server_ip.get(), self.port.get()))
            
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            file_name = os.path.basename(file_path)
            file_size = len(file_data)
            
            header = f"{file_name}\n{file_size}\n".encode()
            client.send(header)
            client.send(file_data)
            
            response = client.recv(1024).decode()
            client.close()
            
            return response == "OK"
            
        except Exception as e:
            self.add_log(f"[✗] Error sending {os.path.basename(file_path)}: {str(e)}")
            return False
            
    def send_files(self):
        if not self.selected_files:
            messagebox.showwarning("Warning", "No scripts selected!")
            return
            
        if not self.server_ip.get():
            messagebox.showerror("Error", "Please enter PS5 IP address!")
            return
            
        self.send_btn.config(state=DISABLED, text="⏳ SENDING...")
        self.status_label.config(text="Sending scripts to PS5...")
        self.progress_bar['maximum'] = len(self.selected_files)
        self.progress_bar['value'] = 0
        
        success_count = 0
        
        for i, file_path in enumerate(self.selected_files):
            file_name = os.path.basename(file_path)
            self.status_label.config(text=f"Sending: {file_name}")
            self.add_log(f"[→] Sending: {file_name}")
            self.root.update()
            
            if file_path.endswith('.js'):
                success = self.send_script(file_path)
            else:
                success = self.send_binary(file_path)
                
            if success:
                success_count += 1
                self.status_label.config(text=f"✓ Sent: {file_name}")
                self.add_log(f"[✓] Success: {file_name}")
            else:
                self.status_label.config(text=f"✗ Failed: {file_name}")
                self.add_log(f"[✗] Failed: {file_name}")
                
            self.progress_bar['value'] = i + 1
            self.root.update()
            time.sleep(0.3)
            
        result_text = f"Complete! {success_count}/{len(self.selected_files)} scripts sent"
        self.status_label.config(text=result_text)
        self.add_log(f"[*] Result: {result_text}")
        
        if success_count == len(self.selected_files):
            messagebox.showinfo("Success", f"All {success_count} scripts sent successfully!")
        else:
            messagebox.showwarning("Partial Success", result_text)
            
        self.send_btn.config(state=NORMAL, text="🚀 SEND TO PS5")
        
    def send_files_thread(self):
        import threading
        thread = threading.Thread(target=self.send_files)
        thread.daemon = True
        thread.start()

if __name__ == "__main__":
    root = Tk()
    app = PS5ScriptSender(root)
    root.mainloop()